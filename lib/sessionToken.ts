// 署名付きセッショントークンの発行・検証。
// crypto.subtle（Web Crypto API）のみを使うため、Node.js実行環境・Edge実行環境（middleware）の両方で動く。
export interface SessionPayload {
  userId: number;
  role: "owner" | "staff";
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET が設定されていません。.env.local を確認してください。");
  }
  return secret;
}

function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(Buffer.from(value, "base64url"));
}

async function hmacKey(): Promise<CryptoKey> {
  const secretBytes = new TextEncoder().encode(getSecret());
  return crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const key = await hmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return `${base64UrlEncode(data)}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [dataPart, sigPart] = token.split(".");
  if (!dataPart || !sigPart) {
    return null;
  }

  const key = await hmacKey();
  const data = base64UrlDecode(dataPart);
  const signature = base64UrlDecode(sigPart);

  const valid = await crypto.subtle.verify("HMAC", key, signature, data);
  if (!valid) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(data)) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
