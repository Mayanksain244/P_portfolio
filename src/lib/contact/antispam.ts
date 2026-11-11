import { createHmac, timingSafeEqual } from "node:crypto";
import { LIMITS } from "./schema";

export const MIN_FILL_MS = 3_000;
export const MAX_AGE_MS = 2 * 60 * 60 * 1000;

function mac(ts: number, secret: string): string {
  return createHmac("sha256", secret).update(`contact-form|${ts}`).digest("hex");
}

/** Token handed to the browser when the form renders: `<ms-timestamp>.<hmac>`. */
export function signFormToken(secret: string, now = Date.now()): string {
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return `${now}.${mac(now, secret)}`;
}

export type TokenCheck = "ok" | "invalid" | "tooFast" | "expired";

export function verifyFormToken(
  token: unknown,
  secret: string,
  now = Date.now(),
): TokenCheck {
  if (typeof token !== "string" || !secret) return "invalid";
  const m = /^(\d{10,16})\.([0-9a-f]{64})$/.exec(token);
  if (!m) return "invalid";
  const ts = Number(m[1]);
  const given = Buffer.from(m[2], "hex");
  const expected = Buffer.from(mac(ts, secret), "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return "invalid";
  }
  const age = now - ts;
  if (age < MIN_FILL_MS) return "tooFast";
  if (age > MAX_AGE_MS) return "expired";
  return "ok";
}

const URL_RE = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"']+/gi;

export function countUrls(text: string): number {
  return (text.match(URL_RE) ?? []).length;
}

export function hasTooManyUrls(text: string): boolean {
  return countUrls(text) > LIMITS.maxUrls;
}
