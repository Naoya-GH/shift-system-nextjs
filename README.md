# シフト管理システム（Next.js版 / LOLIPOP! Deploy Now 用）

`shift-system`（PHP版）と同じ機能をNext.js（TypeScript）で再実装したものです。
LOLIPOP! Deploy Now（Next.js専用のサーバーレスホスティング）にデプロイする前提のため、データベースは
ローカルSQLiteファイルではなく [Turso](https://turso.tech/)（SQLite互換のホスティング型DB）を使います。

## セットアップ手順

### 1. ローカルで動作確認する（Tursoアカウント不要）

`.env.local.example` を `.env.local` にコピーし、そのまま使えばローカルのファイルDB（`local.db`）で動作確認できます。

```bash
cp .env.local.example .env.local
npm install
npm run db:init          # テーブルを作成
npm run db:create-owner  # 初回オーナーアカウントを作成（対話式 or --name=... --password=... で指定）
npm run dev
```

`http://localhost:3000` を開いて、作成したオーナーでログインできれば動作確認は完了です。

### 2. Tursoに接続する（本番用）

1. [Turso](https://turso.tech/) の無料アカウントを作成し、データベースを1つ作成する
2. `turso db show <db名> --url` でURLを、`turso db tokens create <db名>` でトークンを取得する
3. `.env.local` の `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` を実際の値に書き換える
4. `SESSION_SECRET` は32文字以上のランダムな文字列に変更する（`openssl rand -hex 32` 等）
5. 再度 `npm run db:init` と `npm run db:create-owner` を実行する

### 3. Deploy Nowにデプロイする

1. このリポジトリをGitHubにpushする
2. Deploy Now側でリポジトリを連携し、環境変数（`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` / `SESSION_SECRET`）をダッシュボードで設定する
   （Deploy Nowはローカルの`.env`ファイルを読み込まないため、ダッシュボード側の設定が必須）
3. デプロイを実行する

## 技術構成

- Next.js（App Router）+ TypeScript
- DB接続: `@libsql/client`（ORM不使用、`lib/repositories/` に手書きSQLのRepositoryパターン）
- 認証: Cookieセッション（`crypto.subtle`によるHMAC署名、DBセッションテーブル不使用）
- パスワードハッシュ: Node組み込みの`scrypt`
- CSRF対策: Next.jsのServer Actionsの同一オリジンチェックに一任（自作のCSRFトークンは不要）
- スタイル: 素のCSS（`app/globals.css`）。Tailwind等は未使用

## ディレクトリ構成

```
lib/
  db/           DB接続・スキーマ
  helpers/      カレンダー・祝日・時間帯などの純粋関数
  repositories/ テーブルごとのCRUD
  services/     業務ロジック（PHP版のServicesを1:1で移植）
scripts/
  init-db.ts        テーブル作成
  create-owner.ts   初回オーナー作成
app/
  login/                     ログイン
  (app)/request/             スタッフのシフト希望提出
  (app)/schedule/            スタッフの確定シフト閲覧（自分/全員タブ）
  (app)/owner/shifts/        オーナーのシフト作成（日付カードUI）
  owner/shifts/print/        確定シフト表（印刷用、ヘッダーなし単独ページ）
  (app)/owner/staff/         スタッフ管理（登録/改名/削除/並び替え）
proxy.ts   ログイン必須・ロール別アクセス制御（Next.js 16の"Proxy"、旧middleware）
```

## スコープ外（今回は未対応）

- 自動バックアップの仕組み（Turso側の機能に一任）
- 既存`shift-system`（PHP版）からのデータ移行（新規DBで作り直しているため）
