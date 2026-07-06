"use server";

import { redirect } from "next/navigation";
import * as calendar from "@/lib/helpers/calendar";
import * as ownerShiftService from "@/lib/services/ownerShiftService";
import * as dayLabelService from "@/lib/services/dayLabelService";

interface DayLabelState {
  lunch: boolean;
  obanzai: boolean;
  custom: string;
}

async function persist(formData: FormData, confirmed: boolean): Promise<void> {
  const yearMonth = String(formData.get("month") ?? calendar.currentMonth());
  const assignedPayload = String(formData.get("assignedPayload") ?? "{}");
  const dayLabelPayload = String(formData.get("dayLabelPayload") ?? "{}");

  let assignedByDate: Record<string, number[]> = {};
  try {
    assignedByDate = JSON.parse(assignedPayload);
  } catch {
    assignedByDate = {};
  }

  let dayLabelsByDate: Record<string, DayLabelState> = {};
  try {
    dayLabelsByDate = JSON.parse(dayLabelPayload);
  } catch {
    dayLabelsByDate = {};
  }

  for (const date of calendar.daysInMonth(yearMonth)) {
    const userIds = assignedByDate[date] ?? [];
    await ownerShiftService.saveDay(date, userIds, confirmed);
  }

  const formByDate: Record<string, { lunch?: string; obanzai?: string; custom?: string }> = {};
  for (const [date, entry] of Object.entries(dayLabelsByDate)) {
    formByDate[date] = {
      lunch: entry.lunch ? "1" : "",
      obanzai: entry.obanzai ? "1" : "",
      custom: entry.custom,
    };
  }
  await dayLabelService.saveMonth(formByDate);

  const message = confirmed ? "シフトを確定しました。" : "シフトを保存しました。";
  redirect(`/owner/shifts?month=${yearMonth}&flash=${encodeURIComponent(message)}`);
}

export async function saveShiftsAction(formData: FormData): Promise<void> {
  await persist(formData, false);
}

export async function confirmShiftsAction(formData: FormData): Promise<void> {
  await persist(formData, true);
}
