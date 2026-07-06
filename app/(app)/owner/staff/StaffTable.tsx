"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import { reorderStaffAction, deleteStaffAction, renameStaffAction } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export default function StaffTable({
  staffList,
  currentUserId,
}: {
  staffList: User[];
  currentUserId: number;
}) {
  const [renameTarget, setRenameTarget] = useState<User | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameDisplayName, setRenameDisplayName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  return (
    <>
      <table className="staff-table">
        <thead>
          <tr>
            <th>並び順</th>
            <th>氏名</th>
            <th>表示名</th>
            <th>権限</th>
            <th>登録日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((user, index) => (
            <tr key={user.id}>
              <td className="reorder-cell">
                <form action={reorderStaffAction} className="reorder-form">
                  <input type="hidden" name="user_id" value={user.id} />
                  <input type="hidden" name="direction" value="up" />
                  <SubmitButton className="btn-reorder" disabled={index === 0}>
                    ▲
                  </SubmitButton>
                </form>
                <form action={reorderStaffAction} className="reorder-form">
                  <input type="hidden" name="user_id" value={user.id} />
                  <input type="hidden" name="direction" value="down" />
                  <SubmitButton className="btn-reorder" disabled={index === staffList.length - 1}>
                    ▼
                  </SubmitButton>
                </form>
              </td>
              <td>{user.name}</td>
              <td>{user.displayName}</td>
              <td>{user.role === "owner" ? "オーナー" : "スタッフ"}</td>
              <td>{user.createdAt.slice(0, 10)}</td>
              <td className="actions-cell">
                <button
                  type="button"
                  className="btn-action btn-action-rename"
                  onClick={() => {
                    setRenameTarget(user);
                    setRenameName(user.name);
                    setRenameDisplayName(user.displayName);
                  }}
                >
                  変更
                </button>
                {user.id !== currentUserId ? (
                  <button
                    type="button"
                    className="btn-action btn-action-delete"
                    onClick={() => setDeleteTarget(user)}
                  >
                    削除
                  </button>
                ) : (
                  <span className="hint-text">（自分）</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="modal-overlay" hidden={renameTarget === null}>
        <div className="modal-box">
          <h3>氏名・表示名を変更</h3>
          <form action={renameStaffAction}>
            <input type="hidden" name="user_id" value={renameTarget?.id ?? ""} />
            <label>
              氏名（ログインに使用）
              <input
                type="text"
                name="name"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
              />
            </label>
            <label>
              表示名（シフト画面・確定シフト表に表示）
              <input
                type="text"
                name="display_name"
                value={renameDisplayName}
                onChange={(e) => setRenameDisplayName(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setRenameTarget(null)}>
                キャンセル
              </button>
              <SubmitButton className="btn btn-primary" pendingText="変更中...">
                変更する
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>

      <div className="modal-overlay" hidden={deleteTarget === null}>
        <div className="modal-box">
          <p>{deleteTarget?.name}さんを削除します。よろしいですか？</p>
          <form action={deleteStaffAction}>
            <input type="hidden" name="user_id" value={deleteTarget?.id ?? ""} />
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                キャンセル
              </button>
              <SubmitButton className="btn btn-primary" pendingText="削除中...">
                実行する
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
