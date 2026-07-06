import { redirect } from "next/navigation";
import { currentUser } from "@/lib/services/authService";
import * as staffAccountService from "@/lib/services/staffAccountService";
import FlashMessage from "@/components/FlashMessage";
import StaffTable from "./StaffTable";
import { createStaffAction } from "./actions";

export default async function OwnerStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string }>;
}) {
  const params = await searchParams;
  const staffList = await staffAccountService.listAll();
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <FlashMessage message={params.flash} />
      <h2>スタッフ管理</h2>
      <p className="hint-text">並び順はシフト作成画面・確定シフト表の表示順にも反映されます。</p>

      <StaffTable staffList={staffList} currentUserId={user.id} />

      <h3>新規スタッフ登録</h3>
      <form action={createStaffAction} className="staff-form">
        <label>
          氏名（ログインに使用）
          <input type="text" name="name" required />
        </label>
        <label>
          表示名（シフト画面・確定シフト表に表示。空欄なら氏名と同じになります）
          <input type="text" name="display_name" />
        </label>
        <label>
          権限
          <select name="role" defaultValue="staff">
            <option value="staff">スタッフ</option>
            <option value="owner">オーナー</option>
          </select>
        </label>
        <label>
          パスワード
          <input type="password" name="password" required minLength={4} />
        </label>
        <button type="submit" className="btn btn-primary">
          登録
        </button>
      </form>
    </>
  );
}
