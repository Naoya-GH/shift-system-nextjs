"use server";

import { redirect } from "next/navigation";
import * as calendar from "@/lib/helpers/calendar";
import * as ownerShiftService from "@/lib/services/ownerShiftService";
import * as dayLabelService from "@/lib/services/dayLabelService";
import type { DayLabelForm } from "@/lib/services/dayLabelService";

const ASSIGNED_PATTERN = /^assigned\[([^\]]+)\]\[\]$/;
const DAY_LABEL_PATTERN = /^dayLabel\[([^\]]+)\]\[(lunch|obanzai|custom)\]$/;

// FormDataを直接読む（JSからJSON文字列を組み立てて渡す方式だと、JS無効/失敗時に
// 何も送信できなくなってしまうため、ブラウザのフォーム送信結果を素直にパースする）
function parseForm(formData: FormData): {
  assignedByDate: Record<string, number[]>;
  dayLabelByDate: Record<string, DayLabelForm>;
} {
  const assignedByDate: Record<string, number[]> = {};
  const dayLabelByDate: Record<string, DayLabelForm> = {};

  for (const [key, value] of formData.entries()) {
    const assignedMatch = key.match(ASSIGNED_PATTERN);
    if (assignedMatch) {
      const date = assignedMatch[1];
      assignedByDate[date] ??= [];
      assignedByDate[date].push(Number(value));
      continue;
    }

    const labelMatch = key.match(DAY_LABEL_PATTERN);
    if (labelMatch) {
      const [, date, field] = labelMatch;
      dayLabelByDate[date] ??= {};
      dayLabelByDate[date][field as keyof DayLabelForm] = String(value);
    }
  }

  return { assignedByDate, dayLabelByDate };
}

async function persist(formData: FormData, confirmed: boolean): Promise<void> {
  const yearMonth = String(formData.get("month") ?? calendar.currentMonth());
  const { assignedByDate, dayLabelByDate } = parseForm(formData);

  for (const date of calendar.daysInMonth(yearMonth)) {
    const userIds = assignedByDate[date] ?? [];
    await ownerShiftService.saveDay(date, userIds, confirmed);
  }

  await dayLabelService.saveMonth(dayLabelByDate);

  const message = confirmed ? "シフトを確定しました。" : "シフトを保存しました。";
  redirect(`/owner/shifts?month=${yearMonth}&flash=${encodeURIComponent(message)}`);
}

export async function saveShiftsAction(formData: FormData): Promise<void> {
  await persist(formData, false);
}

export async function confirmShiftsAction(formData: FormData): Promise<void> {
  await persist(formData, true);
}
