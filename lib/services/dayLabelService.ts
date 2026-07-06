import * as dayLabelRepository from "../repositories/dayLabelRepository";
import type { DayLabelEntry } from "../types";

// 固定プリセットの表示名
export const PRESET_LABELS: Record<"lunch" | "obanzai", string> = {
  lunch: "ランチ",
  obanzai: "おばんざい",
};

// 自由入力（特別営業名など）が長すぎると確定シフト表の縦書き列が伸びすぎるため上限を設ける
const MAX_CUSTOM_LENGTH = 20;

export async function getMonthLabels(yearMonth: string): Promise<Record<string, DayLabelEntry[]>> {
  return dayLabelRepository.findForMonth(yearMonth);
}

export interface DayLabelForm {
  lunch?: string;
  obanzai?: string;
  custom?: string;
}

// lunch/obanzaiは値があれば有効、customは自由入力の特別営業名など
export async function saveMonth(formByDate: Record<string, DayLabelForm>): Promise<void> {
  for (const [workDate, form] of Object.entries(formByDate)) {
    if (typeof form !== "object" || form === null) {
      continue;
    }

    const entries: DayLabelEntry[] = [];
    if (form.lunch) {
      entries.push({ type: "lunch", label: PRESET_LABELS.lunch });
    }
    if (form.obanzai) {
      entries.push({ type: "obanzai", label: PRESET_LABELS.obanzai });
    }

    const custom = (form.custom ?? "").trim().slice(0, MAX_CUSTOM_LENGTH);
    if (custom !== "") {
      entries.push({ type: "custom", label: custom });
    }

    await dayLabelRepository.saveForDate(workDate, entries);
  }
}
