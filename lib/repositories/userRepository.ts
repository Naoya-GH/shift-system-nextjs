import { getDb } from "../db/client";
import type { User } from "../types";

type Row = Record<string, unknown>;

function toModel(row: Row): User {
  return {
    id: Number(row.id),
    name: String(row.name),
    displayName: String(row.display_name),
    role: row.role as "owner" | "staff",
    password: String(row.password),
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
  };
}

export async function findById(id: number): Promise<User | null> {
  const result = await getDb().execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
  const row = result.rows[0];
  return row ? toModel(row as Row) : null;
}

export async function findByName(name: string): Promise<User | null> {
  const result = await getDb().execute({ sql: "SELECT * FROM users WHERE name = ?", args: [name] });
  const row = result.rows[0];
  return row ? toModel(row as Row) : null;
}

export async function all(): Promise<User[]> {
  const result = await getDb().execute("SELECT * FROM users ORDER BY sort_order ASC, id ASC");
  return result.rows.map((row) => toModel(row as Row));
}

export async function create(
  name: string,
  displayName: string,
  role: string,
  hashedPassword: string
): Promise<User> {
  const insertResult = await getDb().execute({
    sql: `INSERT INTO users (name, display_name, role, password, sort_order)
          VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM users))`,
    args: [name, displayName, role, hashedPassword],
  });

  const id = Number(insertResult.lastInsertRowid);
  const user = await findById(id);
  if (!user) {
    throw new Error("ユーザーの作成に失敗しました。");
  }
  return user;
}

export async function swapSortOrder(userIdA: number, userIdB: number): Promise<void> {
  const a = await getDb().execute({ sql: "SELECT sort_order FROM users WHERE id = ?", args: [userIdA] });
  const b = await getDb().execute({ sql: "SELECT sort_order FROM users WHERE id = ?", args: [userIdB] });
  const orderA = Number(a.rows[0]?.sort_order ?? 0);
  const orderB = Number(b.rows[0]?.sort_order ?? 0);

  await getDb().batch(
    [
      { sql: "UPDATE users SET sort_order = ? WHERE id = ?", args: [orderB, userIdA] },
      { sql: "UPDATE users SET sort_order = ? WHERE id = ?", args: [orderA, userIdB] },
    ],
    "write"
  );
}

export async function deleteUser(id: number): Promise<void> {
  await getDb().execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
}

export async function updateNames(id: number, name: string, displayName: string): Promise<void> {
  await getDb().execute({
    sql: "UPDATE users SET name = ?, display_name = ? WHERE id = ?",
    args: [name, displayName, id],
  });
}

export async function updatePassword(id: number, hashedPassword: string): Promise<void> {
  await getDb().execute({
    sql: "UPDATE users SET password = ? WHERE id = ?",
    args: [hashedPassword, id],
  });
}
