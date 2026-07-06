import { redirect } from "next/navigation";
import { currentUser } from "@/lib/services/authService";
import FlashMessage from "@/components/FlashMessage";
import SubmitButton from "@/components/SubmitButton";
import { changePasswordAction } from "./actions";

export default async function AccountPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; error?: string }>;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;

  return (
    <>
      <FlashMessage message={params.flash} />
      <h2>パスワード変更</h2>
      {params.error && <p className="flash-message">{params.error}</p>}
      <form action={changePasswordAction}>
        <label>
          現在のパスワード
          <input type="password" name="current_password" autoComplete="current-password" required />
        </label>
        <label>
          新しいパスワード
          <input
            type="password"
            name="new_password"
            autoComplete="new-password"
            required
            minLength={4}
          />
        </label>
        <label>
          新しいパスワード（確認）
          <input
            type="password"
            name="new_password_confirm"
            autoComplete="new-password"
            required
            minLength={4}
          />
        </label>
        <SubmitButton className="btn btn-primary" pendingText="変更中...">
          変更する
        </SubmitButton>
      </form>
    </>
  );
}
