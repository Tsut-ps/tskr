# tskr

ログイン不要のシンプルな進捗管理ツール (フロントエンド部分)  
※バックエンドは Supabase に構築

## スクリーンショット

<img width="1351" height="585" alt="image" src="https://github.com/user-attachments/assets/e7df64ff-7022-43d3-8789-d021fc25de2f" />

<img width="1360" height="604" alt="image" src="https://github.com/user-attachments/assets/7f9c7596-04dd-4cf3-bf03-6020aef8246f" />

<img width="1357" height="559" alt="image" src="https://github.com/user-attachments/assets/e46c06aa-3e6c-45e4-91ae-a2c82733f3b5" />

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

データベース（詳しい構築方法は略）

<img width="1523" height="1205" alt="image" src="https://github.com/user-attachments/assets/7f663dfb-9c7e-4638-9731-2066a6163078" />

## Supabase CLI でデータベースの型を更新

https://supabase.com/docs/guides/api/rest/generating-types

```
npx supabase gen types typescript --project-id <Supabase/ProjectのID> --schema public > src/types/database.types.ts
```
