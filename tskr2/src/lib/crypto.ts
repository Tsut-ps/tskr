import sodium from "libsodium-wrappers-sumo";
import { Payloads, type Payload, type RecordKind, type SecretBox } from "./schema";

/**
 * E2E 暗号化はすべて libsodium の高水準 API で行う。独自のプリミティブは書かない。
 * - パスフレーズ → 鍵: Argon2id (crypto_pwhash)
 * - 対称暗号: XChaCha20-Poly1305 (crypto_aead_xchacha20poly1305_ietf)
 * - 鍵の受け渡し: X25519 sealed box (crypto_box_seal)
 * - 招待の検証: HMAC-SHA512-256 (crypto_auth)
 */

export const ready = sodium.ready;

const B64 = () => sodium.base64_variants.URLSAFE_NO_PADDING;
const toB64 = (bytes: Uint8Array) => sodium.to_base64(bytes, B64());
const fromB64 = (text: string) => sodium.from_base64(text, B64());

export type Identity = { publicKey: Uint8Array; privateKey: Uint8Array };

// ---- パスフレーズ / リカバリーキーによる秘密鍵の保護 ----

function deriveKey(secret: string, salt: Uint8Array, opslimit: number, memlimit: number) {
  return sodium.crypto_pwhash(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    secret,
    salt,
    opslimit,
    memlimit,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );
}

function lock(secret: string, data: Uint8Array): SecretBox {
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const opslimit = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;
  const memlimit = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;
  const key = deriveKey(secret, salt, opslimit, memlimit);
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(data, null, null, nonce, key);
  sodium.memzero(key);
  return { salt: toB64(salt), nonce: toB64(nonce), ciphertext: toB64(ciphertext), opslimit, memlimit };
}

function unlock(secret: string, box: SecretBox): Uint8Array {
  const key = deriveKey(secret, fromB64(box.salt), box.opslimit, box.memlimit);
  try {
    return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, fromB64(box.ciphertext), null, fromB64(box.nonce), key);
  } finally {
    sodium.memzero(key);
  }
}

/** 初回: 鍵ペアを作り、パスフレーズとリカバリーキーの両方で秘密鍵を暗号化する */
export function createIdentity(passphrase: string) {
  const { publicKey, privateKey } = sodium.crypto_box_keypair();
  const recoveryKey = toB64(sodium.randombytes_buf(32));
  return {
    identity: { publicKey, privateKey } satisfies Identity,
    recoveryKey,
    upload: {
      publicKey: toB64(publicKey),
      encryptedPrivateKey: { passphrase: lock(passphrase, privateKey), recovery: lock(recoveryKey, privateKey) },
    },
  };
}

/** パスフレーズ (またはリカバリーキー) で秘密鍵を復号する。失敗時は例外 */
export function unlockIdentity(publicKeyB64: string, secret: string, box: SecretBox): Identity {
  const privateKey = unlock(secret, box);
  const publicKey = fromB64(publicKeyB64);
  if (sodium.compare(sodium.crypto_scalarmult_base(privateKey), publicKey) !== 0) {
    throw new Error("key mismatch");
  }
  return { publicKey, privateKey };
}

export function publicKeyFingerprint(publicKey: Uint8Array | string): string {
  const bytes = typeof publicKey === "string" ? fromB64(publicKey) : publicKey;
  return sodium.to_hex(sodium.crypto_generichash(16, bytes, null)).match(/.{4}/g)!.join("-");
}

// ---- ワークスペース鍵 ----

export function createWorkspaceKey(): Uint8Array {
  return sodium.crypto_aead_xchacha20poly1305_ietf_keygen();
}

export function sealKey(workspaceKey: Uint8Array, recipientPublicKey: Uint8Array | string): string {
  const pk = typeof recipientPublicKey === "string" ? fromB64(recipientPublicKey) : recipientPublicKey;
  return toB64(sodium.crypto_box_seal(workspaceKey, pk));
}

export function openSealedKey(sealed: string, identity: Identity): Uint8Array {
  return sodium.crypto_box_seal_open(fromB64(sealed), identity.publicKey, identity.privateKey);
}

// ---- レコード ----

/** サーバーがレコードを別の場所へ差し替えても復号に失敗するよう、位置情報を関連データに含める */
function associatedData(workspaceId: string, recordId: string, kind: RecordKind, epoch: number) {
  return `tskr2|${workspaceId}|${recordId}|${kind}|${epoch}`;
}

export function encryptRecord<K extends RecordKind>(
  key: Uint8Array,
  ctx: { workspaceId: string; recordId: string; kind: K; epoch: number },
  payload: Payload<K>,
) {
  const plaintext = JSON.stringify(Payloads[ctx.kind].parse(payload));
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ad = associatedData(ctx.workspaceId, ctx.recordId, ctx.kind, ctx.epoch);
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, ad, null, nonce, key);
  return { nonce: toB64(nonce), ciphertext: toB64(ciphertext) };
}

export function decryptRecord<K extends RecordKind>(
  key: Uint8Array,
  ctx: { workspaceId: string; recordId: string; kind: K; epoch: number },
  sealed: { nonce: string; ciphertext: string },
): Payload<K> {
  const ad = associatedData(ctx.workspaceId, ctx.recordId, ctx.kind, ctx.epoch);
  const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null, fromB64(sealed.ciphertext), ad, fromB64(sealed.nonce), key, "text",
  );
  return Payloads[ctx.kind].parse(JSON.parse(plaintext)) as Payload<K>;
}

// ---- 招待 ----

/** URL の # 以降に載せる招待トークン。サーバーには送らない */
export function createInviteToken(): string {
  return toB64(sodium.randombytes_buf(32));
}

/** 参加者: 自分の公開鍵がすり替えられていないことを示す MAC */
export function proveKey(token: string, publicKey: Uint8Array): string {
  return toB64(sodium.crypto_auth(publicKey, inviteMacKey(token)));
}

/** 管理者: 参加申請の公開鍵が招待トークンの持ち主のものか検証する */
export function verifyKeyProof(token: string, publicKey: string, proof: string): boolean {
  return sodium.crypto_auth_verify(fromB64(proof), fromB64(publicKey), inviteMacKey(token));
}

function inviteMacKey(token: string) {
  // 32 byte のトークンを鍵、用途ラベルをメッセージにした BLAKE2b で MAC 用の鍵を導出する
  return sodium.crypto_generichash(sodium.crypto_auth_KEYBYTES, "tskr2-invite", fromB64(token));
}

export function newId(): string {
  return toB64(sodium.randombytes_buf(16));
}
