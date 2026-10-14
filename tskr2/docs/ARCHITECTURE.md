# tskr2 アーキテクチャ設計

tskr（Next.js + Supabase、認証なし・平文保存）を土台に、Cloudflare の無料枠だけで運用できる
エンドツーエンド暗号化（E2EE）のタスク管理サービス（Backlog 代替）を作る。

## 1. 目標と前提

| 要件 | 方針 |
| --- | --- |
| 完全無料 | Cloudflare Workers Free プランのみ。R2・有料アドオン・外部 SaaS は使わない |
| 想定規模 | 20 チーム以上（例: 20 チーム × 10 人 = 200 人）。後述の無料枠試算で 1 デプロイに収まる |
| データ暗号化 / E2E / ゼロ知識 | タスク本文・名前・タグなどの内容はブラウザで暗号化。サーバーは暗号文とルーティング用メタデータのみ保持 |
| 最小権限 | Worker のバインディング、ロール、OAuth スコープ、CSP、デプロイ用トークンをすべて最小化 |
| データ分離 | ワークスペースごとに 1 つの Durable Object（専用 SQLite）。鍵もワークスペースごとに別 |
| 責務分離 | 添付ファイルは保存しない。Google Drive / Figma / GitHub などの URL を暗号化して埋め込む |
| Discord ライク | 左端にワークスペース（サーバー）列、その右にチーム（チャンネル）列、メインにタスク |
| 車輪の再発明をしない | 認証は Better Auth、暗号は libsodium、HTTP は Hono。独自の暗号プリミティブ・セッション実装はしない |

## 2. 構成

```
Browser (React SPA)                         Cloudflare (Workers Free)
┌──────────────────────────┐   HTTPS    ┌──────────────────────────────────────┐
│ UI (shadcn/ui 流用)       │──────────▶│ Worker (Hono)                         │
│ libsodium で暗号化/復号    │           │  ├ /api/auth/*  → Better Auth         │
│ 秘密鍵はメモリのみ         │           │  ├ /api/*       → 認可チェック        │
└──────────────────────────┘           │  └ 静的アセット (Workers Static Assets)│
           ▲  WebSocket (更新通知のみ)    │                                        │
           └──────────────────────────── │ D1: ユーザー, セッション, メンバー,    │
                                         │     公開鍵, ラップ済みワークスペース鍵  │
                                         │ Durable Object × ワークスペース数:     │
                                         │     暗号化レコード (SQLite) + WS 配信  │
                                         └──────────────────────────────────────┘
```

### 採用するもの / しないもの

| 採用 | 理由 |
| --- | --- |
| Workers + Static Assets | Pages の後継。SPA と API を 1 デプロイで配信。静的アセット配信は無料・無制限 |
| Hono | Workers 標準的な軽量ルーター。依存ゼロ |
| D1 | ユーザー・セッション・メンバーシップなど「全体で引く」データ。5GB / 日 500 万読み取りまで無料 |
| Durable Objects (SQLite) | ワークスペース単位の物理分離と、WebSocket Hibernation によるリアルタイム通知。Free プランで利用可、ストレージ課金なし |
| Better Auth | セッション管理、OAuth、CSRF 対策、レート制限を任せる。D1 を直接アダプタとして受け付ける |
| libsodium (`libsodium-wrappers-sumo`) | Argon2id、XChaCha20-Poly1305、X25519 sealed box を監査済み実装で使う |
| Vite + React + Tailwind | tskr の shadcn/ui コンポーネントを流用。E2E は全部クライアント処理なので SSR は不要 |

| 不採用 | 理由 |
| --- | --- |
| Next.js (OpenNext) | E2E では SSR がほぼ無意味。Free プランの Worker サイズ上限にも余裕がなくなる |
| R2 | 有効化に支払い手段の登録が要る。重いデータは持たない方針なので不要 |
| Cloudflare Access | 無料は 50 ユーザーまでで、20 チーム規模だと超える可能性が高い |
| メール送信 (マジックリンク等) | 無料で安定した送信手段が Cloudflare 内にない。OAuth に任せる |
| 独自暗号・独自セッション | 要件どおり信頼できるライブラリに任せる |

### 無料枠の試算（200 人・1 日 8 時間利用）

| リソース | 上限 (Free/日) | 想定 |
| --- | --- | --- |
| Workers リクエスト | 100,000 | 200 人 × 約 150 API 呼び出し ≒ 30,000 |
| DO リクエスト | 100,000 | 書き込み・同期・WS 接続で約 30,000（受信 WS メッセージは 20:1 換算） |
| DO 実行時間 | 13,000 GB-s | WebSocket Hibernation で待機中は課金されない |
| D1 読み取り | 5,000,000 行 | セッション確認とメンバー確認のみ。十分 |
| ストレージ | D1 5GB / DO 5GB | 暗号化テキストのみ（1 レコード上限 64KB）。添付なし |

上限に達すると当日はエラーになる（課金はされない）。超える規模になったら Workers Paid（$5/月）へ移行するだけでコード変更は不要。

## 3. 認証とセッション

- **ログイン**: Better Auth のソーシャルログイン（GitHub / Google）。パスワードを保存しない。
  - OAuth スコープは既定の最小（プロフィールとメールのみ）。プロバイダのトークンは使わないので
    `account.encryptOAuthTokens` で暗号化保存。
- **セッション**: Better Auth が D1 にセッションを保存し、`HttpOnly; Secure; SameSite=Lax` の Cookie を発行。
  有効期限 7 日、1 日ごとに延長。ログアウト・全端末ログアウトは Better Auth の API をそのまま使う。
- **レート制限**: Better Auth 組み込み（D1 保存）。
- **CSRF**: Better Auth の Origin チェック + 独自 API も `Origin` を検証。
- **将来**: パスキー（`@better-auth/passkey`）を 2 要素目として追加。

ログイン（誰であるか）と E2E の鍵（何を読めるか）は分離する。サーバーやセッションが奪われても、
E2E パスフレーズがなければ内容は読めない。

## 4. E2E 鍵管理（ゼロ知識）

すべて libsodium の高水準 API で実装し、プリミティブを組み合わせる独自プロトコルは最小限にとどめる。

| 鍵 | 生成 | 保存場所 |
| --- | --- | --- |
| ユーザー鍵ペア (X25519) | 初回ログイン時にブラウザで `crypto_box_keypair` | 公開鍵: D1。秘密鍵: Argon2id(パスフレーズ) で導出した鍵で XChaCha20-Poly1305 暗号化して D1 |
| ワークスペース鍵 (32 byte) | ワークスペース作成時に `crypto_aead_xchacha20poly1305_ietf_keygen` | メンバーごとに公開鍵で `crypto_box_seal` して D1（`epoch` 付き） |
| レコード暗号化 | ワークスペース鍵で XChaCha20-Poly1305 | DO の SQLite |

- **関連データ (AD)**: `workspaceId|recordId|kind|epoch` を AEAD の AD に入れる。サーバーがレコードを
  別ワークスペースや別 ID に差し替えても復号に失敗する。
- **復号済み秘密鍵**: メモリ上のみ。localStorage / IndexedDB には平文で保存しない。タブを閉じたら再入力。
- **招待**: 招待リンク `https://…/invite/<id>#<token>` の `#` 以降はサーバーに送られない。
  参加者は自分の公開鍵に `crypto_auth(token)` の MAC を付けて参加申請し、管理者のブラウザが MAC を検証してから
  ワークスペース鍵を参加者の公開鍵に封印する。サーバーが公開鍵をすり替える中間者攻撃を検出できる。
- **メンバー除外**: 新しい `epoch` のワークスペース鍵を生成し、残るメンバーにだけ配布。以後の書き込みは新 epoch。
  古いレコードは編集時に新 epoch で再暗号化される（一括再暗号化はしない）。
- **パスフレーズ紛失**: サーバーは復元できない（ゼロ知識の帰結）。初回設定時にリカバリーキーを表示し、
  同じ秘密鍵をリカバリーキーでも暗号化して保存する。

### サーバーから見えるもの（正直な限界）

見えない: ワークスペース名、チーム名、タスクのタイトル・本文・状態・期限・担当者・タグ、コメント、埋め込み URL。
見える: ユーザーのメール・表示名（OAuth 由来）、誰がどのワークスペースに属するか、レコード ID・種別・サイズ・更新時刻・更新者。

Web アプリの E2E は「配信される JS を信頼する」前提がある。これを狭めるため、厳格な CSP、
第三者スクリプトなし、依存を最小化、デプロイは GitHub Actions からスコープを絞った API トークンでのみ行う。

## 5. データ分離と最小権限

- **ワークスペース = 1 Durable Object**（`idFromName(workspaceId)`）。SQLite は DO ごとに独立し、
  クエリが他ワークスペースのデータに触れる経路がない。
- **認可はすべて Worker 入口**で D1 のメンバーシップを確認してから DO を呼ぶ。DO は外部から直接呼べない。
- **ロール**: `owner` / `admin` / `member` / `viewer`。サーバーは内容を読めないが、書き込み可否・招待・除外は
  ロールで強制する。
- **Worker バインディング**: `DB`（D1）と `WORKSPACE`（DO）のみ。KV・R2・AI 等は付けない。
- **CSP**: `default-src 'self'`、`connect-src 'self'`、`frame-ancestors 'none'`、`script-src 'self' 'wasm-unsafe-eval'`（libsodium の WASM のため）。
- **デプロイ用トークン**: Workers Scripts / D1 / DO の Edit だけを持つ Cloudflare API トークンを GitHub Actions Secret に置く。

## 6. データモデル

### D1（サーバーが読む）

| テーブル | 用途 |
| --- | --- |
| `user` / `session` / `account` / `verification` / `rateLimit` | Better Auth 管理 |
| `user_keys` | 公開鍵、暗号化済み秘密鍵（パスフレーズ用・リカバリーキー用）、KDF パラメータ |
| `workspaces` | ID、作成者、現在の `epoch` |
| `workspace_members` | ワークスペース × ユーザー、ロール、状態（`pending` / `active`）、招待 MAC |
| `workspace_keys` | ワークスペース × ユーザー × epoch のラップ済み鍵 |
| `invites` | 招待 ID、作成者、有効期限、使用回数上限 |

### Durable Object（暗号文のみ）

`records(id, kind, epoch, nonce, ciphertext, version, updated_at, updated_by, deleted)`

`kind` ごとの復号後の中身（`src/lib/schema.ts` の zod スキーマ）は tskr の Supabase スキーマを引き継ぐ:

| kind | 中身 | tskr での対応 |
| --- | --- | --- |
| `workspace` | name, description | `projects` |
| `team` | name, description | `teams` |
| `tag` | name, color | `tags` |
| `task` | teamId, title, description, status, progress, startDate, dueDate, assigneeIds, tagIds, embeds | `tasks` + `task_users` + `task_tags` |
| `comment` | taskId, body, embeds | 新規（Discord 風スレッド） |

検索・絞り込み・ガントは復号後にクライアントで行う。20 チーム規模ならワークスペースあたり数千件で、全件同期で問題ない。
同期は `version` による差分取得 + WebSocket の「更新あり」通知（内容は送らない）。

## 7. tskr から流用するもの

| 流用 | 方法 |
| --- | --- |
| shadcn/ui コンポーネント | `src/components/ui` を必要なものから移植（Radix 依存は使う分だけ追加） |
| データモデル | 上記 zod スキーマに変換 |
| タスクのステータス・進捗・期日 UI、フォーム部品 | Supabase 呼び出しを暗号化ストア呼び出しに差し替えて移植 |
| Tailwind のダークテーマ配色 | Discord 風に調整して流用 |

作り直すもの: データアクセス層（Supabase → 暗号化ストア）、ルーティング（Next.js App Router → SPA）、認証（なし → Better Auth）。

## 8. 段階計画

1. **土台（この PR）**: Worker / D1 / DO / Better Auth / 鍵の生成・ロック解除 / ワークスペース作成 / チームとタスクの暗号化 CRUD / Discord 風レイアウト
2. 招待 UI とメンバー承認、メンバー除外時の鍵ローテーション
3. tskr のタスク詳細・フィルタ・進捗 UI の移植、コメント、埋め込みカード
4. パスキー、リカバリーキー UI、GitHub Actions デプロイ
