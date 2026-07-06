"use server";

import { redirect } from "next/navigation";
import { attemptLogin, login } from "@/lib/services/authService";

export async function loginAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await attemptLogin(name, password);

  if (!user) {
    redirect(
      `/login?error=${encodeURIComponent("名前またはパスワードが正しくありません。")}&name=${encodeURIComponent(name)}`
    );
  }

  await login(user);
  redirect(user.role === "owner" ? "/owner/shifts" : "/request");
}
