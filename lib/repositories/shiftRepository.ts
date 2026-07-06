import { getDb } from "../db/client";
import type { InValue } from "@libsql/client";
import type { ShiftRow } from "../types";

type Row = Record<string, unknown>;
type Statement = { sql: string; args: InValue[] };

function toModel(row: Row): ShiftRow {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    workDate: String(row.work_date),
    confirmed: Number(row.confirmed) === 1,
    createdAt: String(row.created_at),
  };
}

export async function findForUserAndMonth(
  userId: number,
  yearMonth: string
): Promise<Record<string, ShiftRow>> {
  const result = await getDb().execute({
    sql: "SELECT * FROM shifts WHERE user_id = ? AND work_date LIKE ?",
    args: [userId, `${yearMonth}-%`],
  });

  const out: Record<string, ShiftRow> = {};
  for (const row of result.rows) {
    const model = toModel(row as Row);
    out[model.workDate] = model;
  }
  return out;
}

export async function findForDate(workDate: string): Promise<Record<number, ShiftRow>> {
  const result = await getDb().execute({ sql: "SELECT * FROM shifts WHERE work_date = ?", args: [workDate] });

  const out: Record<number, ShiftRow> = {};
  for (const row of result.rows) {
    const model = toModel(row as Row);
    out[model.userId] = model;
  }
  return out;
}

export async function saveForDate(
  workDate: string,
  userIds: number[],
  confirmed: boolean
): Promise<void> {
  const statements: Statement[] = [];

  if (userIds.length === 0) {
    statements.push({ sql: "DELETE FROM shifts WHERE work_date = ?", args: [workDate] });
  } else {
    const placeholders = userIds.map(() => "?").join(",");
    statements.push({
      sql: `DELETE FROM shifts WHERE work_date = ? AND user_id NOT IN (${placeholders})`,
      args: [workDate, ...userIds],
    });
  }

  for (const userId of userIds) {
    statements.push({
      sql: `INSERT INTO shifts (user_id, work_date, confirmed)
            VALUES (?, ?, ?)
            ON CONFLICT (user_id, work_date)
            DO UPDATE SET confirmed = excluded.confirmed`,
      args: [userId, workDate, confirmed ? 1 : 0],
    });
  }

  await getDb().batch(statements, "write");
}

export async function deleteForUser(userId: number): Promise<void> {
  await getDb().execute({ sql: "DELETE FROM shifts WHERE user_id = ?", args: [userId] });
}
