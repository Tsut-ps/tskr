import { useEffect, useState } from "react";
import { Centered } from "@/components/Centered";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { MyKeys } from "@/lib/api-types";
import { authClient } from "@/lib/auth-client";
import { type Identity, ready } from "@/lib/crypto";
import { Shell } from "@/screens/Shell";
import { SetupKeys, Unlock } from "@/screens/Vault";

/**
 * 画面の段階:
 * 1. 未ログイン → OAuth でログイン (Better Auth)
 * 2. 鍵なし → E2E パスフレーズを決めて鍵を作る
 * 3. 鍵あり・ロック中 → パスフレーズで秘密鍵を復号 (メモリにだけ置く)
 * 4. Discord 風のメイン画面
 */
export function App() {
  const session = authClient.useSession();
  const [sodiumReady, setSodiumReady] = useState(false);
  const [me, setMe] = useState<{ userId: string; keys: MyKeys } | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    void ready.then(() => setSodiumReady(true));
  }, []);

  useEffect(() => {
    if (session.data) void api.me().then(setMe);
  }, [session.data]);

  if (session.isPending || !sodiumReady) return <Centered>読み込み中…</Centered>;
  if (!session.data) return <SignIn />;
  if (!me) return <Centered>読み込み中…</Centered>;
  if (!me.keys) return <SetupKeys onDone={(id) => void api.me().then((m) => (setMe(m), setIdentity(id)))} />;
  if (!identity) return <Unlock keys={me.keys} onUnlock={setIdentity} />;
  return <Shell userId={me.userId} userName={session.data.user.name} identity={identity} />;
}

function SignIn() {
  const signIn = (provider: "github" | "google") =>
    authClient.signIn.social({ provider, callbackURL: location.pathname + location.hash });
  return (
    <Centered>
      <h1 className="text-2xl font-bold">tskr2</h1>
      <p className="text-sm text-muted-foreground">エンドツーエンド暗号化されたタスク管理</p>
      <div className="flex flex-col gap-2 w-64">
        <Button onClick={() => void signIn("github")}>GitHub でログイン</Button>
        <Button variant="secondary" onClick={() => void signIn("google")}>
          Google でログイン
        </Button>
      </div>
    </Centered>
  );
}
