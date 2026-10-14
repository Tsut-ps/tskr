import { z } from "zod";

// クライアントとサーバーで共有する型。サーバーが見るのは Envelope / API 入力だけで、
// Payload (復号後の中身) はブラウザでしか扱わない。

export const recordKinds = ["workspace", "team", "tag", "task", "comment", "invite"] as const;
export const RecordKind = z.enum(recordKinds);
export type RecordKind = z.infer<typeof RecordKind>;

export const roles = ["owner", "admin", "member", "viewer"] as const;
export const Role = z.enum(roles);
export type Role = z.infer<typeof Role>;

const id = z.string().min(1).max(64);
const b64 = z.string().max(200_000);

/** 1 レコードの暗号文上限。重いデータは持たず、外部 URL の埋め込みで扱う */
export const MAX_CIPHERTEXT_LENGTH = 64 * 1024;

/** DO に保存される暗号化レコード */
export const Envelope = z.object({
  id,
  kind: RecordKind,
  epoch: z.number().int().positive(),
  nonce: b64,
  ciphertext: z.string().max(MAX_CIPHERTEXT_LENGTH),
  version: z.number().int().nonnegative(),
  updatedAt: z.number().int(),
  updatedBy: z.string(),
  deleted: z.boolean(),
});
export type Envelope = z.infer<typeof Envelope>;

export const PutRecordInput = z.object({
  kind: RecordKind,
  epoch: z.number().int().positive(),
  nonce: b64,
  ciphertext: z.string().max(MAX_CIPHERTEXT_LENGTH),
  /** 楽観ロック: 新規作成は 0 */
  baseVersion: z.number().int().nonnegative(),
  deleted: z.boolean().default(false),
});
export type PutRecordInput = z.infer<typeof PutRecordInput>;

/** libsodium secretbox (XChaCha20-Poly1305) + Argon2id のパラメータ */
export const SecretBox = z.object({
  salt: b64,
  nonce: b64,
  ciphertext: b64,
  opslimit: z.number().int().positive(),
  memlimit: z.number().int().positive(),
});
export type SecretBox = z.infer<typeof SecretBox>;

export const UserKeysInput = z.object({
  publicKey: b64,
  encryptedPrivateKey: z.object({ passphrase: SecretBox, recovery: SecretBox }),
});
export type UserKeysInput = z.infer<typeof UserKeysInput>;

export const CreateWorkspaceInput = z.object({ sealedKey: b64 });

export const CreateInviteInput = z.object({
  role: z.enum(["admin", "member", "viewer"]).default("member"),
  expiresInHours: z.number().int().min(1).max(24 * 14).default(72),
  maxUses: z.number().int().min(1).max(100).default(10),
});

export const JoinInput = z.object({ keyProof: b64 });

export const ApproveInput = z.object({
  sealedKeys: z.array(z.object({ epoch: z.number().int().positive(), sealedKey: b64 })).min(1),
});

// ---- 復号後の中身 (tskr の Supabase スキーマを引き継ぐ) ----

export const Embed = z.object({
  url: z.url({ protocol: /^https$/ }),
  title: z.string().max(200).optional(),
});

export const taskStatuses = ["open", "in_progress", "done", "closed"] as const;

export const Payloads = {
  workspace: z.object({ name: z.string().min(1).max(100), description: z.string().max(2000).optional() }),
  team: z.object({ name: z.string().min(1).max(100), description: z.string().max(2000).optional() }),
  tag: z.object({ name: z.string().min(1).max(50), color: z.string().max(20).optional() }),
  task: z.object({
    teamId: id,
    title: z.string().min(1).max(200),
    description: z.string().max(20_000).optional(),
    status: z.enum(taskStatuses).default("open"),
    progress: z.number().int().min(0).max(100).default(0),
    startDate: z.iso.date().optional(),
    dueDate: z.iso.date().optional(),
    assigneeIds: z.array(z.string()).default([]),
    tagIds: z.array(id).default([]),
    embeds: z.array(Embed).max(20).default([]),
  }),
  comment: z.object({
    taskId: id,
    body: z.string().min(1).max(10_000),
    embeds: z.array(Embed).max(10).default([]),
  }),
  /** 招待トークン。ワークスペース鍵で暗号化して共有し、どの管理者のブラウザでも参加申請を検証できるようにする */
  invite: z.object({ inviteId: id, token: b64 }),
} satisfies Record<RecordKind, z.ZodType>;

export type Payload<K extends RecordKind> = z.infer<(typeof Payloads)[K]>;

export const RemoveMemberInput = z.object({
  epoch: z.number().int().positive(),
  keys: z.array(z.object({ userId: z.string(), sealedKey: b64 })),
});
