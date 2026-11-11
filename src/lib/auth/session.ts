import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  signSessionToken,
  verifySessionToken,
} from "./token";

export { SESSION_COOKIE };

/** Signs a session JWT and sets the httpOnly cookie. */
export async function createSession(): Promise<void> {
  const token = await signSessionToken();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function verifySession(
  token: string | undefined | null,
): Promise<boolean> {
  return verifySessionToken(token);
}

/** True when the current request carries a valid admin session. */
export async function getSession(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/**
 * Call first in EVERY admin server action, route handler and admin page.
 * Redirects to the login page when there is no valid session.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await getSession())) redirect("/admin/login");
}
