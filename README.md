# tskr

> 後継の [tskr2](tskr2/)（Cloudflare 無料枠・E2E 暗号化）を開発中です。

ログイン不要の進捗管理ツール (フロントエンド部分)  
※バックエンドは Supabase に構築する予定

## 環境構築

```bash
npm install
npm run dev
```

[localhost:3000](http://localhost:3000) で開きます。

## 環境変数

.env.local に Supabase の情報を入れます。

- アクセス制御 (RLS) の使える `ANON_KEY` を用いています
- 環境変数はサーバーサイドのみで扱っています (public ではない)

```
SUPABASE_URL=https://<Supabase/ProjectのID>.supabase.co
SUPABASE_ANON_KEY=<Supabase/ProjectのAnonKey>
```

## Supabase の構築

(現状略)

## Supabase CLI でデータベースの型を更新

https://supabase.com/docs/guides/api/rest/generating-types

```
npx supabase gen types typescript --project-id <Supabase/ProjectのID> --schema public > src/types/database.types.ts
```
