// Edge-safe session token helpers (jose only; no Node APIs, no next/headers).
// Used by middleware and by the server-only session module.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SEC = 8 * 60 * 60;

function secretKey(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

export async function signSessionToken(): Promise<string> {
  const key = secretKey();
  if (!key) throw new Error("AUTH_SECRET is missing or too short");
  return new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(key);
}

/** True only for a valid, unexpired HS256 token whose subject is "admin". */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const key = secretKey();
  if (!key) return false;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.sub === "admin";
  } catch {
    return false;
  }
}
