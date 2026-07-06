import { redirect } from "next/navigation";
import { currentUser } from "@/lib/services/authService";
import { loginAction } from "./actions";

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
      <h1 className="app-title">シフト管理システム</h1>
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
        <button type="submit" className="btn btn-primary">
          ログイン
        </button>
      </form>
    </main>
  );
}
