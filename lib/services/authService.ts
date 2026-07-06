import { hashPassword, verifyPassword } from "../password";
import * as userRepository from "../repositories/userRepository";
import { createSessionCookie, destroySessionCookie, getSessionPayload } from "../session";
import type { User } from "../types";
import { ValidationError } from "../errors";

export async function attemptLogin(name: string, password: string): Promise<User | null> {
  const user = await userRepository.findByName(name);
  if (!user) {
    return null;
  }
  const valid = await verifyPassword(password, user.password);
  return valid ? user : null;
}

export async function login(user: User): Promise<void> {
  await createSessionCookie(user.id, user.role);
}

export async function logout(): Promise<void> {
  await destroySessionCookie();
}

export async function currentUser(): Promise<User | null> {
  const session = await getSessionPayload();
  if (!session) {
    return null;
  }
  return userRepository.findById(session.userId);
}

// ログイン中の本人が、現在のパスワードを確認した上で自分のパスワードを変更する
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ValidationError("対象のアカウントが見つかりません。");
  }

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    throw new ValidationError("現在のパスワードが正しくありません。");
  }

  if (newPassword.length < 4) {
    throw new ValidationError("新しいパスワードは4文字以上で入力してください。");
  }

  const hashed = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, hashed);
}
