"use server";

import { redirect } from "next/navigation";
import { currentUser, changePassword } from "@/lib/services/authService";
import { ValidationError } from "@/lib/errors";

export async function changePasswordAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const newPasswordConfirm = String(formData.get("new_password_confirm") ?? "");

  if (newPassword !== newPasswordConfirm) {
    redirect(`/account/password?error=${encodeURIComponent("新しいパスワードが一致しません。")}`);
  }

  let message = "パスワードを変更しました。";
  try {
    await changePassword(user.id, currentPassword, newPassword);
  } catch (e) {
    if (e instanceof ValidationError) {
      redirect(`/account/password?error=${encodeURIComponent(e.message)}`);
    }
    throw e;
  }

  redirect(`/account/password?flash=${encodeURIComponent(message)}`);
}
