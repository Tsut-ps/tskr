import { DurableObject } from "cloudflare:workers";
import type { ChangeNotice } from "../src/lib/api-types";
import type { Envelope, PutRecordInput } from "../src/lib/schema";

type Row = {
  id: string;
  kind: string;
  epoch: number;
  nonce: string;
  ciphertext: string;
  version: number;
  updated_at: number;
  updated_by: string;
  deleted: number;
};

export type PutResult = { ok: true; record: Envelope } | { ok: false; error: "conflict" };

/**
 * 1 ワークスペース = 1 インスタンス。専用の SQLite を持つので、他ワークスペースのデータに触れる経路がない。
 * 保存するのは暗号文だけで、内容を解釈しない。
 * Worker 側で認可を済ませてから RPC で呼ばれる前提 (外部から直接は呼べない)。
 */
export class WorkspaceDO extends DurableObject<Env> {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        epoch INTEGER NOT NULL,
        nonce TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        version INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        updated_by TEXT NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS records_version_idx ON records (version);
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
      INSERT OR IGNORE INTO meta (key, value) VALUES ('version', 0);
    `);
  }

  private currentVersion(): number {
    return this.sql.exec<{ value: number }>("SELECT value FROM meta WHERE key = 'version'").one().value;
  }

  /** since より新しい変更を返す (差分同期) */
  async list(since: number): Promise<{ version: number; records: Envelope[] }> {
    const rows = this.sql
      .exec<Row>("SELECT * FROM records WHERE version > ? ORDER BY version", since)
      .toArray();
    return { version: this.currentVersion(), records: rows.map(toEnvelope) };
  }

  async put(id: string, input: PutRecordInput, userId: string): Promise<PutResult> {
    // DO は単一スレッドなので、この中の読み書きは直列化される
    const existing = this.sql.exec<Row>("SELECT * FROM records WHERE id = ?", id).toArray()[0];
    const existingVersion = existing?.version ?? 0;
    if (existingVersion !== input.baseVersion) return { ok: false, error: "conflict" };
    if (existing && existing.kind !== input.kind) return { ok: false, error: "conflict" };

    const version = this.currentVersion() + 1;
    const now = Date.now();
    this.sql.exec("UPDATE meta SET value = ? WHERE key = 'version'", version);
    this.sql.exec(
      `INSERT INTO records (id, kind, epoch, nonce, ciphertext, version, updated_at, updated_by, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET epoch = excluded.epoch, nonce = excluded.nonce,
         ciphertext = excluded.ciphertext, version = excluded.version, updated_at = excluded.updated_at,
         updated_by = excluded.updated_by, deleted = excluded.deleted`,
      id, input.kind, input.epoch, input.nonce, input.ciphertext, version, now, userId, input.deleted ? 1 : 0,
    );
    this.broadcast({ type: "changed", version });
    const row = this.sql.exec<Row>("SELECT * FROM records WHERE id = ?", id).one();
    return { ok: true, record: toEnvelope(row) };
  }

  /** 更新通知用 WebSocket。Hibernation API で待機中は課金されない。通知だけ送り、内容は HTTP で取りに来させる */
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
    const userId = request.headers.get("X-User-Id");
    if (!userId) return new Response("forbidden", { status: 403 });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [userId]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  /** メンバー除外時に、その人の接続を切る */
  async disconnect(userId: string): Promise<void> {
    for (const ws of this.ctx.getWebSockets(userId)) ws.close(4003, "removed");
  }

  async webSocketMessage(): Promise<void> {
    // クライアントからの書き込みは受け付けない (認可を HTTP 側に集約するため)
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    ws.close(code, reason);
  }

  private broadcast(notice: ChangeNotice) {
    const message = JSON.stringify(notice);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(message);
      } catch {
        // 切断済みの接続は無視
      }
    }
  }
}

function toEnvelope(row: Row): Envelope {
  return {
    id: row.id,
    kind: row.kind as Envelope["kind"],
    epoch: row.epoch,
    nonce: row.nonce,
    ciphertext: row.ciphertext,
    version: row.version,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    deleted: row.deleted === 1,
  };
}
