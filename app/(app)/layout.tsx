import { currentUser } from "@/lib/services/authService";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <>
      <header className="app-header">
        <h1 className="app-title">シフト管理システム</h1>
        {user && (
          <nav className="app-nav">
            {user.role === "owner" ? (
              <>
                <a href="/owner/shifts">シフト作成</a>
                <a href="/owner/staff">スタッフ管理</a>
              </>
            ) : (
              <>
                <a href="/request">シフト希望提出</a>
                <a href="/schedule">確定シフト確認</a>
              </>
            )}
            <a href="/logout">ログアウト</a>
          </nav>
        )}
      </header>
      <main className="app-main">{children}</main>
    </>
  );
}
