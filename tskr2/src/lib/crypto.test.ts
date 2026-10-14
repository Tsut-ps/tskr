import { beforeAll, describe, expect, it } from "vitest";
import {
  createIdentity,
  createInviteToken,
  createWorkspaceKey,
  decryptRecord,
  encryptRecord,
  openSealedKey,
  proveKey,
  ready,
  sealKey,
  unlockIdentity,
  publicKeyFingerprint,
  verifyKeyProof,
} from "./crypto";
import sodium from "libsodium-wrappers-sumo";

const sodiumB64 = (b: Uint8Array) => sodium.to_base64(b, sodium.base64_variants.URLSAFE_NO_PADDING);

beforeAll(async () => {
  await ready;
});

describe("identity", () => {
  it("unlocks with the passphrase and the recovery key, not with a wrong one", () => {
    const { identity, recoveryKey, upload } = createIdentity("correct horse");
    const a = unlockIdentity(upload.publicKey, "correct horse", upload.encryptedPrivateKey.passphrase);
    const b = unlockIdentity(upload.publicKey, recoveryKey, upload.encryptedPrivateKey.recovery);
    expect(a.privateKey).toEqual(identity.privateKey);
    expect(b.privateKey).toEqual(identity.privateKey);
    expect(() => unlockIdentity(upload.publicKey, "wrong", upload.encryptedPrivateKey.passphrase)).toThrow();
  });
});

describe("records", () => {
  const ctx = { workspaceId: "w1", recordId: "r1", kind: "task" as const, epoch: 1 };

  it("round-trips a task through a sealed workspace key", () => {
    const { identity } = createIdentity("pw");
    const key = openSealedKey(sealKey(createWorkspaceKey(), identity.publicKey), identity);
    const sealed = encryptRecord(key, ctx, {
      teamId: "t1", title: "設計", status: "open", progress: 0, assigneeIds: [], tagIds: [], embeds: [],
    });
    expect(sealed.ciphertext).not.toContain("設計");
    expect(decryptRecord(key, ctx, sealed).title).toBe("設計");
  });

  it("rejects a record moved to another id or workspace", () => {
    const key = createWorkspaceKey();
    const sealed = encryptRecord(key, ctx, {
      teamId: "t1", title: "x", status: "open", progress: 0, assigneeIds: [], tagIds: [], embeds: [],
    });
    expect(() => decryptRecord(key, { ...ctx, recordId: "r2" }, sealed)).toThrow();
    expect(() => decryptRecord(key, { ...ctx, workspaceId: "w2" }, sealed)).toThrow();
  });
});

describe("invites", () => {
  it("detects a swapped public key", () => {
    const token = createInviteToken();
    const real = createIdentity("a").upload.publicKey;
    const { identity } = createIdentity("a");
    const proof = proveKey(token, identity.publicKey);
    expect(verifyKeyProof(token, createIdentity("b").upload.publicKey, proof)).toBe(false);
    expect(verifyKeyProof(createInviteToken(), real, proof)).toBe(false);
    expect(verifyKeyProof(token, sodiumB64(identity.publicKey), proof)).toBe(true);
  });
});

describe("fingerprint", () => {
  it("is stable and readable", () => {
    const { upload } = createIdentity("a");
    expect(publicKeyFingerprint(upload.publicKey)).toMatch(/^([0-9a-f]{4}-){7}[0-9a-f]{4}$/);
  });
});
