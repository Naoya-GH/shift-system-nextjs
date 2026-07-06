"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/services/authService";
import * as shiftRequestService from "@/lib/services/shiftRequestService";
import type { EntryInput } from "@/lib/services/shiftRequestService";

export async function saveRequestAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  const month = String(formData.get("month") ?? "");
  const payload = String(formData.get("payload") ?? "{}");

  let entries: Record<string, Record<string, EntryInput>>;
  try {
    entries = JSON.parse(payload);
  } catch {
    entries = {};
  }

  await shiftRequestService.saveMonth(user.id, entries);

  redirect(`/request?month=${month}&flash=${encodeURIComponent("シフト希望を保存しました。")}`);
}
