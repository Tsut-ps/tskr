# tskr2

Cloudflare の無料枠だけで動く、エンドツーエンド暗号化されたタスク管理（Backlog 代替）。
tskr の UI とデータモデルを引き継ぎ、認証・暗号化・データ分離を加えた作り直し版です。

設計は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。

## 構成

- `worker/` … Cloudflare Worker (Hono)。Better Auth、認可、ワークスペースごとの Durable Object
- `src/` … React SPA。libsodium で暗号化・復号し、Discord 風の画面を描画
- `src/lib/schema.ts` … クライアントとサーバーで共有する zod スキーマ
- `migrations/` … D1 のスキーマ

## ローカル開発

```sh
npm install
cp .dev.vars.example .dev.vars   # GitHub / Google の OAuth クライアントを設定
npm run db:migrate:local
npm run dev                      # http://localhost:5173
```

OAuth のコールバック URL は `http://localhost:5173/api/auth/callback/github`（Google は `/callback/google`）です。

```sh
npm run typecheck
npm test
```

## デプロイ (Workers Free)

```sh
npx wrangler d1 create tskr2              # 出力された database_id を wrangler.jsonc に設定
npm run db:migrate:remote
npx wrangler secret put BETTER_AUTH_SECRET   # 32 文字以上のランダム文字列
npx wrangler secret put GITHUB_CLIENT_ID     # 以下 OAuth の各値
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
# wrangler.jsonc の BETTER_AUTH_URL を本番 URL に変更
npm run deploy
```
