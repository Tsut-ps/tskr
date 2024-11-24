# tskr

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

※ $PROJECT_REF には `<Supabase/ProjectのID>` を挿入する形
