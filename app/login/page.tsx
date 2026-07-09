import { redirect } from "next/navigation";
import { currentUser } from "@/lib/services/authService";
import { appConfig } from "@/lib/config";
import { loginAction } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; name?: string }>;
}) {
  const user = await currentUser();
  if (user) {
    redirect(user.role === "owner" ? "/owner/shifts" : "/request");
  }

  const params = await searchParams;

  return (
    <main className="login-page">
      <h1 className="app-title">{appConfig.name}</h1>
      {params.error && <p className="flash-message">{params.error}</p>}
      <form action={loginAction} className="login-form">
        <label>
          名前
          <input type="text" name="name" defaultValue={params.name ?? ""} required autoFocus />
        </label>
        <label>
          パスワード
          <input type="password" name="password" required />
        </label>
        <SubmitButton className="btn btn-primary" pendingText="ログイン中...">
          ログイン
        </SubmitButton>
      </form>
    </main>
  );
}
