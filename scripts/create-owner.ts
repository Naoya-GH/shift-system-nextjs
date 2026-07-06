import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { getDb } from "../lib/db/client";
import { hashPassword } from "../lib/password";

function argValue(flag: string): string | null {
  const prefix = `--${flag}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

async function main() {
  const existing = await getDb().execute("SELECT COUNT(*) as count FROM users WHERE role = 'owner'");
  const count = Number(existing.rows[0]?.count ?? 0);
  if (count > 0) {
    console.log("オーナーアカウントは既に登録されています。セットアップは不要です。");
    return;
  }

  let name = argValue("name");
  let password = argValue("password");

  if (name === null || password === null) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    if (name === null) {
      name = (await rl.question("オーナーの氏名を入力してください: ")).trim();
    }
    if (password === null) {
      password = (await rl.question("オーナーのパスワードを入力してください: ")).trim();
    }
    rl.close();
  }

  if (name === "" || password.length < 4) {
    console.error("氏名と4文字以上のパスワードが必要です。");
    process.exit(1);
  }

  const hashed = await hashPassword(password);
  await getDb().execute({
    sql: `INSERT INTO users (name, display_name, role, password, sort_order)
          VALUES (?, ?, 'owner', ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM users))`,
    args: [name, name, hashed],
  });

  console.log("オーナーアカウントを作成しました。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
