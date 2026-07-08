import * as calendar from "../helpers/calendar";
import * as shiftSlots from "../helpers/shiftSlots";
import * as shiftStatus from "../helpers/shiftStatus";
import * as shiftTimeSymbol from "../helpers/shiftTimeSymbol";
import * as userRepository from "../repositories/userRepository";
import * as shiftRequestRepository from "../repositories/shiftRequestRepository";
import * as shiftRepository from "../repositories/shiftRepository";
import type { User } from "../types";

export interface RequestRow {
  slotLabel: string;
  status: string;
  label: string;
  timeText: string;
  memo: string;
}

export interface CellData {
  assigned: boolean;
  confirmed: boolean;
  requests: RequestRow[];
}

export interface MonthView {
  dates: string[];
  staffList: User[];
  cells: Record<string, Record<number, CellData>>;
  statusCounts: Record<string, { ok: number; maybe: number }>;
}

// 月全体を、日付ごと・スタッフごとの割当と希望明細として返す（オーナーを除く）
export async function getMonthView(yearMonth: string): Promise<MonthView> {
  const allUsers = await userRepository.all();
  const staffList = allUsers.filter((u) => u.role !== "owner");

  const dates = calendar.daysInMonth(yearMonth);
  const cells: MonthView["cells"] = {};
  const statusCounts: MonthView["statusCounts"] = {};

  const requestsByDate = await shiftRequestRepository.findForMonthAllUsers(yearMonth);
  const shiftsByDate = await shiftRepository.findForMonthAllUsers(yearMonth);

  for (const date of dates) {
    const requestsByUser = requestsByDate[date] ?? {};
    const shiftsByUser = shiftsByDate[date] ?? {};
    statusCounts[date] = { ok: 0, maybe: 0 };
    cells[date] = {};

    for (const user of staffList) {
      const shift = shiftsByUser[user.id];
      const requestsBySlot = requestsByUser[user.id] ?? {};

      const requestRows: RequestRow[] = [];
      const hasStatus: { ok: boolean; maybe: boolean } = { ok: false, maybe: false };

      for (const slotKey of shiftSlots.keys()) {
        const request = requestsBySlot[slotKey];
        if (!request) continue;

        if (request.status === "ok" || request.status === "maybe") {
          hasStatus[request.status] = true;
        }

        const timeText =
          request.startTime !== "" || request.endTime !== ""
            ? `${request.startTime}〜${request.endTime}`
            : "";

        requestRows.push({
          slotLabel: shiftSlots.label(slotKey),
          status: request.status,
          label: shiftStatus.label(request.status),
          timeText,
          memo: request.memo,
        });
      }

      if (hasStatus.ok) statusCounts[date].ok++;
      if (hasStatus.maybe) statusCounts[date].maybe++;

      cells[date][user.id] = {
        assigned: shift !== undefined,
        confirmed: shift?.confirmed ?? false,
        requests: requestRows,
      };
    }
  }

  return { dates, staffList, cells, statusCounts };
}

// assignedUserIds: 割り当てるスタッフの user_id 配列
export async function saveDay(
  workDate: string,
  assignedUserIds: number[],
  confirm: boolean
): Promise<void> {
  await shiftRepository.saveForDate(workDate, assignedUserIds, confirm);
}

export interface PrintView {
  dates: string[];
  staffList: User[];
  cellText: Record<string, Record<number, string>>;
  footnotes: { date: string; userName: string; timeText: string }[];
}

// 確定済みシフトのみを対象にした印刷用シートのデータを返す
export async function getPrintView(yearMonth: string): Promise<PrintView> {
  const allUsers = await userRepository.all();
  const staffList = allUsers.filter((u) => u.role !== "owner");

  const dates = calendar.daysInMonth(yearMonth);
  const cellText: PrintView["cellText"] = {};
  const footnotes: PrintView["footnotes"] = [];

  const shiftsByDate = await shiftRepository.findForMonthAllUsers(yearMonth);
  const requestsByDate = await shiftRequestRepository.findForMonthAllUsers(yearMonth);

  for (const date of dates) {
    const shiftsByUser = shiftsByDate[date] ?? {};
    const requestsByUser = requestsByDate[date] ?? {};
    cellText[date] = {};

    for (const user of staffList) {
      const shift = shiftsByUser[user.id];
      if (!shift || !shift.confirmed) {
        cellText[date][user.id] = "";
        continue;
      }

      let request = null;
      for (const slotKey of shiftSlots.keys()) {
        const candidate = requestsByUser[user.id]?.[slotKey];
        if (candidate) {
          request = candidate;
          break;
        }
      }

      if (!request) {
        // 希望自体がない出勤指定（おばんざい・ランチ等の昼営業スタッフなど）は空欄のままにする
        cellText[date][user.id] = "";
        continue;
      }

      if (request.startTime === "" && request.endTime === "") {
        // 時間未指定の希望は◯/△の記号のみ表示する（夜営業の時間記号とは別扱い）
        cellText[date][user.id] = shiftStatus.label(request.status);
        continue;
      }

      const symbol = shiftTimeSymbol.symbolFor(request.startTime, request.endTime);
      if (symbol !== null) {
        cellText[date][user.id] = symbol;
        continue;
      }

      cellText[date][user.id] = shiftTimeSymbol.OTHER_SYMBOL;
      footnotes.push({
        date,
        userName: user.displayName,
        timeText: `${request.startTime}〜${request.endTime}`,
      });
    }
  }

  return { dates, staffList, cellText, footnotes };
}
