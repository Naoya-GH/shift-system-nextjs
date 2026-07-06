import { cookies } from "next/headers";
import { appConfig } from "./config";
import { signSessionToken, verifySessionToken, type SessionPayload } from "./sessionToken";

export async function createSessionCookie(userId: number, role: "owner" | "staff"): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + appConfig.session.maxAgeSeconds;
  const token = await signSessionToken({ userId, role, exp });

  const store = await cookies();
  store.set(appConfig.session.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: appConfig.session.maxAgeSeconds,
  });
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(appConfig.session.cookieName);
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(appConfig.session.cookieName)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}
