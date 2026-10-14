import type { Role, SecretBox } from "./schema";

export type MyKeys = {
  publicKey: string;
  encryptedPrivateKey: { passphrase: SecretBox; recovery: SecretBox };
} | null;

export type WorkspaceSummary = {
  id: string;
  role: Role;
  status: "pending" | "active";
  currentEpoch: number;
  /** epoch -> 自分の公開鍵で封印されたワークスペース鍵 */
  sealedKeys: Record<number, string>;
};

export type PendingMember = {
  userId: string;
  name: string;
  publicKey: string;
  keyProof: string;
  inviteId: string;
};

/** WebSocket で配信する通知。内容は含めない */
export type ChangeNotice = { type: "changed"; version: number };
