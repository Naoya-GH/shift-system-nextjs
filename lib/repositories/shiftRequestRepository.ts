import { getDb } from "../db/client";
import type { ShiftRequestRow } from "../types";

type Row = Record<string, unknown>;

function toModel(row: Row): ShiftRequestRow {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    month: String(row.month),
    workDate: String(row.work_date),
    slot: String(row.slot),
    status: row.status as "ok" | "maybe",
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    memo: String(row.memo),
    createdAt: String(row.created_at),
  };
}

export async function findForUserAndMonth(
  userId: number,
  yearMonth: string
): Promise<Record<string, Record<string, ShiftRequestRow>>> {
  const result = await getDb().execute({
    sql: "SELECT * FROM shift_requests WHERE user_id = ? AND month = ?",
    args: [userId, yearMonth],
  });

  const out: Record<string, Record<string, ShiftRequestRow>> = {};
  for (const row of result.rows) {
    const model = toModel(row as Row);
    out[model.workDate] ??= {};
    out[model.workDate][model.slot] = model;
  }
  return out;
}

export async function findForDate(
  workDate: string
): Promise<Record<number, Record<string, ShiftRequestRow>>> {
  const result = await getDb().execute({
    sql: "SELECT * FROM shift_requests WHERE work_date = ?",
    args: [workDate],
  });

  const out: Record<number, Record<string, ShiftRequestRow>> = {};
  for (const row of result.rows) {
    const model = toModel(row as Row);
    out[model.userId] ??= {};
    out[model.userId][model.slot] = model;
  }
  return out;
}

export async function upsert(
  userId: number,
  workDate: string,
  slot: string,
  status: string,
  startTime: string,
  endTime: string,
  memo: string
): Promise<void> {
  const month = workDate.slice(0, 7);
  await getDb().execute({
    sql: `INSERT INTO shift_requests (user_id, month, work_date, slot, status, start_time, end_time, memo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (user_id, work_date, slot)
          DO UPDATE SET
              status     = excluded.status,
              start_time = excluded.start_time,
              end_time   = excluded.end_time,
              memo       = excluded.memo,
              month      = excluded.month`,
    args: [userId, month, workDate, slot, status, startTime, endTime, memo],
  });
}

export async function deleteForUser(userId: number): Promise<void> {
  await getDb().execute({ sql: "DELETE FROM shift_requests WHERE user_id = ?", args: [userId] });
}
