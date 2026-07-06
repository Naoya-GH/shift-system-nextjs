import { verifyPassword } from "../password";
import * as userRepository from "../repositories/userRepository";
import { createSessionCookie, destroySessionCookie, getSessionPayload } from "../session";
import type { User } from "../types";

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
