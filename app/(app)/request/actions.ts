"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/services/authService";
import * as shiftRequestService from "@/lib/services/shiftRequestService";
import type { EntryInput } from "@/lib/services/shiftRequestService";

const FIELD_NAME_PATTERN = /^entries\[([^\]]+)\]\[([^\]]*)\]\[(status|startTime|endTime|memo)\]$/;

// FormDataを直接読む（JSからJSON文字列を組み立てて渡す方式だと、JS無効/失敗時に
// 何も送信できなくなってしまうため、ブラウザのフォーム送信結果を素直にパースする）
function parseEntries(formData: FormData): Record<string, Record<string, EntryInput>> {
  const entries: Record<string, Record<string, EntryInput>> = {};

  for (const [key, value] of formData.entries()) {
    const match = key.match(FIELD_NAME_PATTERN);
    if (!match) continue;

    const [, date, slot, field] = match;
    entries[date] ??= {};
    entries[date][slot] ??= {};
    entries[date][slot][field as keyof EntryInput] = String(value);
  }

  return entries;
}

export async function saveRequestAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  const month = String(formData.get("month") ?? "");
  const entries = parseEntries(formData);

  await shiftRequestService.saveMonth(user.id, entries);

  redirect(`/request?month=${month}&flash=${encodeURIComponent("シフト希望を保存しました。")}`);
}
