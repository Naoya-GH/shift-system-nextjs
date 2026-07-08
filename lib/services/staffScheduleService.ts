import * as calendar from "../helpers/calendar";
import * as shiftSlots from "../helpers/shiftSlots";
import * as shiftRepository from "../repositories/shiftRepository";
import * as shiftRequestRepository from "../repositories/shiftRequestRepository";
import * as userRepository from "../repositories/userRepository";

export interface ScheduleEntry {
  working: boolean;
  timeText: string;
}

// 月の全日付を、確定シフト（confirmed のみ）の出勤/休みと出勤時間とあわせて返す
// 出勤時間は、対応する希望に時間指定があった場合のみ入る（なければ空文字）
export async function getMonthSchedule(
  userId: number,
  yearMonth: string
): Promise<Record<string, ScheduleEntry>> {
  const shiftsByDate = await shiftRepository.findForUserAndMonth(userId, yearMonth);
  const requestsByDate = await shiftRequestRepository.findForUserAndMonth(userId, yearMonth);

  const schedule: Record<string, ScheduleEntry> = {};
  for (const date of calendar.daysInMonth(yearMonth)) {
    const shift = shiftsByDate[date];
    const working = shift !== undefined && shift.confirmed;

    let timeText = "";
    if (working) {
      for (const slotKey of shiftSlots.keys()) {
        const request = requestsByDate[date]?.[slotKey];
        if (request && (request.startTime !== "" || request.endTime !== "")) {
          timeText = `${request.startTime}〜${request.endTime}`;
          break;
        }
      }
    }

    schedule[date] = { working, timeText };
  }

  return schedule;
}

// 店全体の確定シフトを、日付ごとの出勤者名一覧として返す（オーナーは含めない）
export async function getMonthOverview(yearMonth: string): Promise<Record<string, string[]>> {
  const allUsers = await userRepository.all();
  const staffList = allUsers.filter((u) => u.role !== "owner");

  const shiftsByDate = await shiftRepository.findForMonthAllUsers(yearMonth);

  const overview: Record<string, string[]> = {};
  for (const date of calendar.daysInMonth(yearMonth)) {
    const shiftsByUser = shiftsByDate[date] ?? {};

    const names: string[] = [];
    for (const user of staffList) {
      const shift = shiftsByUser[user.id];
      if (shift && shift.confirmed) {
        names.push(user.displayName);
      }
    }
    overview[date] = names;
  }

  return overview;
}
