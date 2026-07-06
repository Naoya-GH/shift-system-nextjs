import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFileSync } from "node:fs";
import path from "node:path";
import { getDb } from "../lib/db/client";

async function main() {
  const schema = readFileSync(path.join(process.cwd(), "lib/db/schema.sql"), "utf-8");
  await getDb().executeMultiple(schema);
  console.log("テーブルを作成しました。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
