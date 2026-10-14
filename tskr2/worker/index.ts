import { Hono, type Context } from "hono";
import type { z } from "zod";
import type { MyKeys, PendingMember, WorkspaceSummary } from "../src/lib/api-types";
import {
  ApproveInput,
  CreateInviteInput,
  CreateWorkspaceInput,
  JoinInput,
  PutRecordInput,
  RemoveMemberInput,
  type Role,
  UserKeysInput,
} from "../src/lib/schema";
import { createAuth } from "./auth";

export { WorkspaceDO } from "./workspace-do";

type Vars = { userId: string };
type C = Context<{ Bindings: Env; Variables: Vars }>;

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get("/api/health", (c) => c.json({ ok: true }));

// 認証は Better Auth にそのまま渡す (CSRF・レート制限も Better Auth 側)
app.on(["GET", "POST"], "/api/auth/*", (c) => createAuth(c.env).handler(c.req.raw));

// ここから下はログイン必須
app.use("/api/*", async (c, next) => {
  if (!["GET", "HEAD"].includes(c.req.method)) {
    // Cookie 認証なので、状態を変えるリクエストは同一オリジンからのみ受け付ける
    const origin = c.req.header("Origin");
    if (origin !== new URL(c.env.BETTER_AUTH_URL).origin) return c.json({ error: "bad origin" }, 403);
  }
  const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "unauthorized" }, 401);
  c.set("userId", session.user.id);
  await next();
});

app.get("/api/me", async (c) => {
  const row = await c.env.DB.prepare("SELECT public_key, encrypted_private_key FROM user_keys WHERE user_id = ?")
    .bind(c.get("userId"))
    .first<{ public_key: string; encrypted_private_key: string }>();
  const keys: MyKeys = row
    ? { publicKey: row.public_key, encryptedPrivateKey: JSON.parse(row.encrypted_private_key) }
    : null;
  return c.json({ userId: c.get("userId"), keys });
});

/** 鍵の初回登録。上書きは許さない (乗っ取り後に鍵を差し替えられないように) */
app.put("/api/me/keys", async (c) => {
  const input = await parse(c, UserKeysInput);
  if (!input) return c.json({ error: "invalid input" }, 400);
  const result = await c.env.DB.prepare(
    "INSERT OR IGNORE INTO user_keys (user_id, public_key, encrypted_private_key, created_at) VALUES (?, ?, ?, ?)",
  )
    .bind(c.get("userId"), input.publicKey, JSON.stringify(input.encryptedPrivateKey), Date.now())
    .run();
  if (result.meta.changes === 0) return c.json({ error: "keys already registered" }, 409);
  return c.json({ ok: true }, 201);
});

app.get("/api/workspaces", async (c) => {
  const userId = c.get("userId");
  const { results: members } = await c.env.DB.prepare(
    `SELECT m.workspace_id, m.role, m.status, w.current_epoch
     FROM workspace_members m JOIN workspaces w ON w.id = m.workspace_id
     WHERE m.user_id = ? ORDER BY w.created_at`,
  )
    .bind(userId)
    .all<{ workspace_id: string; role: Role; status: "pending" | "active"; current_epoch: number }>();
  const { results: keys } = await c.env.DB.prepare(
    "SELECT workspace_id, epoch, sealed_key FROM workspace_keys WHERE user_id = ?",
  )
    .bind(userId)
    .all<{ workspace_id: string; epoch: number; sealed_key: string }>();

  const workspaces: WorkspaceSummary[] = members.map((m) => ({
    id: m.workspace_id,
    role: m.role,
    status: m.status,
    currentEpoch: m.current_epoch,
    sealedKeys: Object.fromEntries(
      keys.filter((k) => k.workspace_id === m.workspace_id).map((k) => [k.epoch, k.sealed_key]),
    ),
  }));
  return c.json(workspaces);
});

app.post("/api/workspaces", async (c) => {
  const input = await parse(c, CreateWorkspaceInput);
  if (!input) return c.json({ error: "invalid input" }, 400);
  const userId = c.get("userId");
  const hasKeys = await c.env.DB.prepare("SELECT 1 FROM user_keys WHERE user_id = ?").bind(userId).first();
  if (!hasKeys) return c.json({ error: "register keys first" }, 409);

  const id = crypto.randomUUID();
  const now = Date.now();
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO workspaces (id, created_by, current_epoch, created_at) VALUES (?, ?, 1, ?)").bind(
      id, userId, now,
    ),
    c.env.DB.prepare(
      "INSERT INTO workspace_members (workspace_id, user_id, role, status, created_at) VALUES (?, ?, 'owner', 'active', ?)",
    ).bind(id, userId, now),
    c.env.DB.prepare("INSERT INTO workspace_keys (workspace_id, user_id, epoch, sealed_key) VALUES (?, ?, 1, ?)").bind(
      id, userId, input.sealedKey,
    ),
  ]);
  return c.json({ id }, 201);
});

app.get("/api/workspaces/:id/members", async (c) => {
  const member = await requireMember(c, ["owner", "admin", "member", "viewer"]);
  if (member instanceof Response) return member;
  const { results } = await c.env.DB.prepare(
    `SELECT m.user_id, m.role, m.status, u.name, u.image, k.public_key
     FROM workspace_members m JOIN "user" u ON u.id = m.user_id LEFT JOIN user_keys k ON k.user_id = m.user_id
     WHERE m.workspace_id = ? AND m.status = 'active'`,
  )
    .bind(c.req.param("id"))
    .all();
  return c.json(results);
});

// ---- 暗号化レコード (中身は Durable Object に委譲) ----

app.get("/api/workspaces/:id/records", async (c) => {
  const member = await requireMember(c, ["owner", "admin", "member", "viewer"]);
  if (member instanceof Response) return member;
  const since = Number(c.req.query("since") ?? 0);
  return c.json(await stub(c).list(Number.isFinite(since) ? since : 0));
});

app.put("/api/workspaces/:id/records/:recordId", async (c) => {
  const member = await requireMember(c, ["owner", "admin", "member"]);
  if (member instanceof Response) return member;
  const input = await parse(c, PutRecordInput);
  if (!input) return c.json({ error: "invalid input" }, 400);
  if (input.epoch !== member.currentEpoch) return c.json({ error: "stale epoch" }, 409);
  const adminOnly = input.kind === "workspace" || input.kind === "invite";
  if (adminOnly && !["owner", "admin"].includes(member.role)) return c.json({ error: "forbidden" }, 403);

  const result = await stub(c).put(c.req.param("recordId"), input, c.get("userId"));
  if (!result.ok) return c.json({ error: result.error }, 409);
  return c.json(result.record);
});

app.get("/api/workspaces/:id/ws", async (c) => {
  const member = await requireMember(c, ["owner", "admin", "member", "viewer"]);
  if (member instanceof Response) return member;
  const headers = new Headers(c.req.raw.headers);
  headers.set("X-User-Id", c.get("userId"));
  return stub(c).fetch(new Request(c.req.raw, { headers }));
});

// ---- 招待とメンバー管理 ----

app.post("/api/workspaces/:id/invites", async (c) => {
  const member = await requireMember(c, ["owner", "admin"]);
  if (member instanceof Response) return member;
  const input = await parse(c, CreateInviteInput);
  if (!input) return c.json({ error: "invalid input" }, 400);
  const inviteId = crypto.randomUUID();
  const now = Date.now();
  await c.env.DB.prepare(
    "INSERT INTO invites (id, workspace_id, created_by, role, expires_at, max_uses, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(inviteId, c.req.param("id"), c.get("userId"), input.role, now + input.expiresInHours * 3600_000, input.maxUses, now)
    .run();
  // 招待トークン本体はクライアントが生成し、URL の # 以降に載せる。サーバーには送られない
  return c.json({ inviteId }, 201);
});

app.post("/api/invites/:inviteId/join", async (c) => {
  const input = await parse(c, JoinInput);
  if (!input) return c.json({ error: "invalid input" }, 400);
  const userId = c.get("userId");
  const hasKeys = await c.env.DB.prepare("SELECT 1 FROM user_keys WHERE user_id = ?").bind(userId).first();
  if (!hasKeys) return c.json({ error: "register keys first" }, 409);

  const inviteId = c.req.param("inviteId");
  // 使用回数の確認と加算を 1 文で行い、同時参加での超過を防ぐ
  const invite = await c.env.DB.prepare(
    "UPDATE invites SET uses = uses + 1 WHERE id = ? AND expires_at > ? AND uses < max_uses RETURNING workspace_id, role",
  )
    .bind(inviteId, Date.now())
    .first<{ workspace_id: string; role: Role }>();
  if (!invite) return c.json({ error: "invite invalid or expired" }, 404);

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, status, invite_id, key_proof, created_at)
     VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
  )
    .bind(invite.workspace_id, userId, invite.role, inviteId, input.keyProof, Date.now())
    .run();
  return c.json({ workspaceId: invite.workspace_id, status: "pending" });
});

app.get("/api/workspaces/:id/pending", async (c) => {
  const member = await requireMember(c, ["owner", "admin"]);
  if (member instanceof Response) return member;
  const { results } = await c.env.DB.prepare(
    `SELECT m.user_id AS userId, u.name AS name, k.public_key AS publicKey, m.key_proof AS keyProof, m.invite_id AS inviteId
     FROM workspace_members m JOIN "user" u ON u.id = m.user_id JOIN user_keys k ON k.user_id = m.user_id
     WHERE m.workspace_id = ? AND m.status = 'pending'`,
  )
    .bind(c.req.param("id"))
    .all<PendingMember>();
  return c.json(results);
});

/** 管理者のブラウザが招待 MAC を検証したうえで、ワークスペース鍵を参加者の公開鍵に封印して送る */
app.post("/api/workspaces/:id/members/:userId/approve", async (c) => {
  const member = await requireMember(c, ["owner", "admin"]);
  if (member instanceof Response) return member;
  const input = await parse(c, ApproveInput);
  if (!input) return c.json({ error: "invalid input" }, 400);
  if (!input.sealedKeys.some((k) => k.epoch === member.currentEpoch)) {
    return c.json({ error: "current epoch key required" }, 400);
  }
  const workspaceId = c.req.param("id");
  const target = c.req.param("userId");
  const updated = await c.env.DB.prepare(
    "UPDATE workspace_members SET status = 'active' WHERE workspace_id = ? AND user_id = ? AND status = 'pending'",
  )
    .bind(workspaceId, target)
    .run();
  if (updated.meta.changes === 0) return c.json({ error: "not pending" }, 404);
  await c.env.DB.batch(
    input.sealedKeys.map((k) =>
      c.env.DB.prepare(
        "INSERT OR REPLACE INTO workspace_keys (workspace_id, user_id, epoch, sealed_key) VALUES (?, ?, ?, ?)",
      ).bind(workspaceId, target, k.epoch, k.sealedKey),
    ),
  );
  return c.json({ ok: true });
});

/** メンバー除外と鍵ローテーションを同時に行う。残る全員分の新しい鍵がそろっていなければ拒否する */
app.post("/api/workspaces/:id/members/:userId/remove", async (c) => {
  const member = await requireMember(c, ["owner", "admin"]);
  if (member instanceof Response) return member;
  const input = await parse(c, RemoveMemberInput);
  if (!input) return c.json({ error: "invalid input" }, 400);
  const workspaceId = c.req.param("id");
  const target = c.req.param("userId");

  const { results: remaining } = await c.env.DB.prepare(
    "SELECT user_id, role FROM workspace_members WHERE workspace_id = ? AND status = 'active'",
  )
    .bind(workspaceId)
    .all<{ user_id: string; role: Role }>();
  const targetRow = remaining.find((m) => m.user_id === target);
  if (!targetRow || targetRow.role === "owner") return c.json({ error: "cannot remove" }, 400);

  const newEpoch = member.currentEpoch + 1;
  const expected = new Set(remaining.filter((m) => m.user_id !== target).map((m) => m.user_id));
  const provided = new Set(input.keys.map((k) => k.userId));
  if (input.epoch !== newEpoch || expected.size !== provided.size || [...expected].some((u) => !provided.has(u))) {
    return c.json({ error: "new keys must cover every remaining member" }, 400);
  }

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?").bind(workspaceId, target),
    c.env.DB.prepare("DELETE FROM workspace_keys WHERE workspace_id = ? AND user_id = ?").bind(workspaceId, target),
    c.env.DB.prepare("UPDATE workspaces SET current_epoch = ? WHERE id = ? AND current_epoch = ?").bind(
      newEpoch, workspaceId, member.currentEpoch,
    ),
    ...input.keys.map((k) =>
      c.env.DB.prepare("INSERT INTO workspace_keys (workspace_id, user_id, epoch, sealed_key) VALUES (?, ?, ?, ?)").bind(
        workspaceId, k.userId, newEpoch, k.sealedKey,
      ),
    ),
  ]);
  await stub(c).disconnect(target);
  return c.json({ ok: true, epoch: newEpoch });
});

export default app;

// ---- helpers ----

async function parse<T extends z.ZodType>(c: C, schema: T): Promise<z.infer<T> | null> {
  const body = await c.req.json().catch(() => null);
  const result = schema.safeParse(body);
  return result.success ? result.data : null;
}

/** ワークスペースの有効なメンバーかつ指定ロールであることを確認する。すべての /workspaces/:id 系の入口 */
async function requireMember(c: C, allowed: Role[]) {
  const row = await c.env.DB.prepare(
    `SELECT m.role, w.current_epoch FROM workspace_members m JOIN workspaces w ON w.id = m.workspace_id
     WHERE m.workspace_id = ? AND m.user_id = ? AND m.status = 'active'`,
  )
    .bind(c.req.param("id"), c.get("userId"))
    .first<{ role: Role; current_epoch: number }>();
  if (!row || !allowed.includes(row.role)) return c.json({ error: "forbidden" }, 403);
  return { role: row.role, currentEpoch: row.current_epoch };
}

function stub(c: C) {
  return c.env.WORKSPACE.get(c.env.WORKSPACE.idFromName(c.req.param("id")!));
}
