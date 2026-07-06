import * as shiftRequestRepository from "../repositories/shiftRequestRepository";
import * as calendar from "../helpers/calendar";
import * as shiftSlots from "../helpers/shiftSlots";
import * as shiftStatus from "../helpers/shiftStatus";
import * as businessHours from "../helpers/businessHours";

export interface GridEntry {
  status: string;
  startTime: string;
  endTime: string;
  memo: string;
}

// 月の全日付 × 全区分を、既存の希望（あれば）とあわせて返す
export async function getMonthGrid(
  userId: number,
  yearMonth: string
): Promise<Record<string, Record<string, GridEntry>>> {
  const existing = await shiftRequestRepository.findForUserAndMonth(userId, yearMonth);

  const grid: Record<string, Record<string, GridEntry>> = {};
  for (const date of calendar.daysInMonth(yearMonth)) {
    grid[date] = {};
    for (const slot of shiftSlots.keys()) {
      const request = existing[date]?.[slot];
      grid[date][slot] = {
        status: request?.status ?? "",
        startTime: request?.startTime ?? "",
        endTime: request?.endTime ?? "",
        memo: request?.memo ?? "",
      };
    }
  }
  return grid;
}

export interface EntryInput {
  status?: string;
  startTime?: string;
  endTime?: string;
  memo?: string;
}

// status が無効（未選択）な日/区分はスキップする（＝希望なし。出勤不可を意味する）
// 出勤・退勤時間は status が ok/maybe のときのみ保存する
export async function saveMonth(
  userId: number,
  entries: Record<string, Record<string, EntryInput>>
): Promise<void> {
  for (const [workDate, slots] of Object.entries(entries)) {
    if (typeof slots !== "object" || slots === null) {
      continue;
    }

    for (const [slot, entry] of Object.entries(slots)) {
      if (!shiftSlots.isValid(slot)) {
        continue;
      }

      const status = entry.status ?? "";
      if (!shiftStatus.isValid(status)) {
        continue;
      }

      let startTime = entry.startTime ?? "";
      let endTime = entry.endTime ?? "";
      if (!businessHours.isValid(startTime)) startTime = "";
      if (!businessHours.isValid(endTime)) endTime = "";

      const memo = (entry.memo ?? "").trim();
      await shiftRequestRepository.upsert(userId, workDate, slot, status, startTime, endTime, memo);
    }
  }
}
