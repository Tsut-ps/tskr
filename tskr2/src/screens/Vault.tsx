import { type FormEvent, useState } from "react";
import { Centered } from "@/components/Centered";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { MyKeys } from "@/lib/api-types";
import { createIdentity, type Identity, publicKeyFingerprint, unlockIdentity } from "@/lib/crypto";

const MIN_PASSPHRASE = 12;

export function SetupKeys({ onDone }: { onDone: (identity: Identity) => void }) {
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [created, setCreated] = useState<{ identity: Identity; recoveryKey: string } | null>(null);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (passphrase.length < MIN_PASSPHRASE) return setError(`${MIN_PASSPHRASE} 文字以上にしてください`);
    if (passphrase !== confirm) return setError("確認用が一致しません");
    const { identity, recoveryKey, upload } = createIdentity(passphrase);
    await api.registerKeys(upload);
    setCreated({ identity, recoveryKey });
  };

  if (created) {
    return (
      <Centered>
        <h1 className="text-xl font-bold">リカバリーキーを保管してください</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          パスフレーズを忘れたときに使います。サーバーは復元できません。この画面でしか表示されません。
        </p>
        <code className="bg-input rounded p-3 break-all max-w-md select-all">{created.recoveryKey}</code>
        <Button onClick={() => onDone(created.identity)}>保管しました</Button>
      </Centered>
    );
  }

  return (
    <Centered>
      <h1 className="text-xl font-bold">暗号化パスフレーズを設定</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        ログインとは別のパスフレーズです。データはこのパスフレーズから作る鍵で暗号化され、サーバーは中身を読めません。
      </p>
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-2 w-80">
        <Input type="password" autoComplete="new-password" placeholder="パスフレーズ" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
        <Input type="password" autoComplete="new-password" placeholder="確認" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit">鍵を作成</Button>
      </form>
    </Centered>
  );
}

export function Unlock({ keys, onUnlock }: { keys: NonNullable<MyKeys>; onUnlock: (identity: Identity) => void }) {
  const [secret, setSecret] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    try {
      const box = useRecovery ? keys.encryptedPrivateKey.recovery : keys.encryptedPrivateKey.passphrase;
      onUnlock(unlockIdentity(keys.publicKey, secret.trim(), box));
    } catch {
      setError(useRecovery ? "リカバリーキーが違います" : "パスフレーズが違います");
    }
  };

  return (
    <Centered>
      <h1 className="text-xl font-bold">ロック解除</h1>
      <p className="text-xs text-muted-foreground">鍵の指紋 {publicKeyFingerprint(keys.publicKey)}</p>
      <form onSubmit={submit} className="flex flex-col gap-2 w-80">
        <Input
          type="password"
          autoComplete="current-password"
          placeholder={useRecovery ? "リカバリーキー" : "パスフレーズ"}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit">解除</Button>
        <Button type="button" variant="link" onClick={() => setUseRecovery(!useRecovery)}>
          {useRecovery ? "パスフレーズを使う" : "リカバリーキーを使う"}
        </Button>
      </form>
    </Centered>
  );
}
