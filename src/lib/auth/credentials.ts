import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

// A valid bcrypt hash of a random string, compared against when the real hash
// is unset so timing does not reveal misconfiguration.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKxGhu2O3/0Wl1BUhZ8VZLhUdHbhfZuL6ZQ.G";

function digest(s: string): Buffer {
  return createHash("sha256").update(s).digest();
}

/** Constant-time string comparison (via fixed-length digests). */
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * Checks the fixed admin credentials from env. Always runs bcrypt so timing
 * does not reveal whether the username was right.
 */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const userOk = safeEqual(username, expectedUser);
  let passOk = false;
  try {
    passOk = await bcrypt.compare(password, hash || DUMMY_HASH);
  } catch {
    passOk = false;
  }
  return userOk && passOk && hash.length > 0;
}
