import { getDb } from "../db/client";
import type { InValue } from "@libsql/client";
import type { DayLabelEntry } from "../types";

export async function findForMonth(yearMonth: string): Promise<Record<string, DayLabelEntry[]>> {
  const result = await getDb().execute({
    sql: "SELECT work_date, type, label FROM day_labels WHERE work_date LIKE ?",
    args: [`${yearMonth}-%`],
  });

  const out: Record<string, DayLabelEntry[]> = {};
  for (const row of result.rows) {
    const workDate = String(row.work_date);
    out[workDate] ??= [];
    out[workDate].push({ type: row.type as DayLabelEntry["type"], label: String(row.label) });
  }
  return out;
}

export async function saveForDate(workDate: string, labels: DayLabelEntry[]): Promise<void> {
  const statements: { sql: string; args: InValue[] }[] = [
    { sql: "DELETE FROM day_labels WHERE work_date = ?", args: [workDate] },
  ];

  for (const entry of labels) {
    statements.push({
      sql: "INSERT INTO day_labels (work_date, type, label) VALUES (?, ?, ?)",
      args: [workDate, entry.type, entry.label],
    });
  }

  await getDb().batch(statements, "write");
}
