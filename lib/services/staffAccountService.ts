import { hashPassword } from "../password";
import * as userRepository from "../repositories/userRepository";
import * as shiftRequestRepository from "../repositories/shiftRequestRepository";
import * as shiftRepository from "../repositories/shiftRepository";
import type { User } from "../types";
import { ValidationError } from "../errors";

export { ValidationError };

export async function listAll(): Promise<User[]> {
  return userRepository.all();
}

// name: ログインに使う氏名。displayName: シフト画面等に表示する名前（空なら氏名を使う）
export async function createStaff(
  name: string,
  displayName: string,
  role: string,
  plainPassword: string
): Promise<User> {
  name = name.trim();
  displayName = displayName.trim();

  if (name === "") {
    throw new ValidationError("氏名を入力してください。");
  }
  if (displayName === "") {
    displayName = name;
  }
  if (role !== "owner" && role !== "staff") {
    throw new ValidationError("権限の指定が正しくありません。");
  }
  if (plainPassword.length < 4) {
    throw new ValidationError("パスワードは4文字以上で入力してください。");
  }
  if ((await userRepository.findByName(name)) !== null) {
    throw new ValidationError("同じ名前のアカウントが既に存在します。");
  }

  const hashed = await hashPassword(plainPassword);
  return userRepository.create(name, displayName, role, hashed);
}

export async function moveUp(userId: number): Promise<void> {
  await move(userId, -1);
}

export async function moveDown(userId: number): Promise<void> {
  await move(userId, 1);
}

async function move(userId: number, direction: number): Promise<void> {
  const ordered = await userRepository.all();
  const index = ordered.findIndex((u) => u.id === userId);
  if (index === -1) {
    return;
  }

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= ordered.length) {
    return;
  }

  await userRepository.swapSortOrder(ordered[index].id, ordered[targetIndex].id);
}

// currentUserId: 実行者自身は削除できない。最後のオーナーも削除できない
export async function deleteStaff(userId: number, currentUserId: number): Promise<void> {
  if (userId === currentUserId) {
    throw new ValidationError("自分自身のアカウントは削除できません。");
  }

  const target = await userRepository.findById(userId);
  if (!target) {
    throw new ValidationError("対象のアカウントが見つかりません。");
  }

  if (target.role === "owner") {
    const all = await userRepository.all();
    const ownerCount = all.filter((u) => u.role === "owner").length;
    if (ownerCount <= 1) {
      throw new ValidationError("最後のオーナーアカウントは削除できません。");
    }
  }

  await shiftRequestRepository.deleteForUser(userId);
  await shiftRepository.deleteForUser(userId);
  await userRepository.deleteUser(userId);
}

export async function renameStaff(
  userId: number,
  newName: string,
  newDisplayName: string
): Promise<void> {
  newName = newName.trim();
  newDisplayName = newDisplayName.trim();

  if (newName === "") {
    throw new ValidationError("氏名を入力してください。");
  }
  if (newDisplayName === "") {
    newDisplayName = newName;
  }

  const target = await userRepository.findById(userId);
  if (!target) {
    throw new ValidationError("対象のアカウントが見つかりません。");
  }

  const existing = await userRepository.findByName(newName);
  if (existing && existing.id !== userId) {
    throw new ValidationError("同じ名前のアカウントが既に存在します。");
  }

  await userRepository.updateNames(userId, newName, newDisplayName);
}

// オーナーが他のスタッフのパスワードを変更する（現在のパスワードは不要。パスワードを忘れた場合の救済用）
export async function resetPassword(
  userId: number,
  newPassword: string,
  newPasswordConfirm: string
): Promise<void> {
  if (newPassword !== newPasswordConfirm) {
    throw new ValidationError("新しいパスワードが一致しません。");
  }
  if (newPassword.length < 4) {
    throw new ValidationError("パスワードは4文字以上で入力してください。");
  }

  const target = await userRepository.findById(userId);
  if (!target) {
    throw new ValidationError("対象のアカウントが見つかりません。");
  }

  const hashed = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, hashed);
}
