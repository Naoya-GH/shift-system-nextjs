"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/services/authService";
import * as staffAccountService from "@/lib/services/staffAccountService";

export async function createStaffAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "");
  const displayName = String(formData.get("display_name") ?? "");
  const role = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");

  let message = "スタッフアカウントを登録しました。";
  try {
    await staffAccountService.createStaff(name, displayName, role, password);
  } catch (e) {
    if (e instanceof staffAccountService.ValidationError) {
      message = e.message;
    } else {
      throw e;
    }
  }

  redirect(`/owner/staff?flash=${encodeURIComponent(message)}`);
}

export async function reorderStaffAction(formData: FormData): Promise<void> {
  const userId = Number(formData.get("user_id") ?? 0);
  const direction = String(formData.get("direction") ?? "");

  if (direction === "up") {
    await staffAccountService.moveUp(userId);
  } else if (direction === "down") {
    await staffAccountService.moveDown(userId);
  }

  redirect("/owner/staff");
}

export async function deleteStaffAction(formData: FormData): Promise<void> {
  const userId = Number(formData.get("user_id") ?? 0);
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  let message = "スタッフアカウントを削除しました。";
  try {
    await staffAccountService.deleteStaff(userId, user.id);
  } catch (e) {
    if (e instanceof staffAccountService.ValidationError) {
      message = e.message;
    } else {
      throw e;
    }
  }

  redirect(`/owner/staff?flash=${encodeURIComponent(message)}`);
}

export async function renameStaffAction(formData: FormData): Promise<void> {
  const userId = Number(formData.get("user_id") ?? 0);
  const name = String(formData.get("name") ?? "");
  const displayName = String(formData.get("display_name") ?? "");

  let message = "氏名を変更しました。";
  try {
    await staffAccountService.renameStaff(userId, name, displayName);
  } catch (e) {
    if (e instanceof staffAccountService.ValidationError) {
      message = e.message;
    } else {
      throw e;
    }
  }

  redirect(`/owner/staff?flash=${encodeURIComponent(message)}`);
}
