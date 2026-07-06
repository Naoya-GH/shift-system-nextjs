import { createClient, type Client } from "@libsql/client";

// モジュール読み込み時点ではなく、実際に使われた時点で接続を作る（.env読み込みタイミングに依存しないようにするため）
let cached: Client | undefined;

export function getDb(): Client {
  if (cached) {
    return cached;
  }

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL が設定されていません。.env.local を確認してください（ローカル検証時は file:./local.db でも可）。"
    );
  }

  cached = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return cached;
}
