// Pure redirect decision for /admin/** so it can be unit-tested.
export const LOGIN_PATH = "/admin/login";

/** Only allow same-site /admin paths as post-login targets. */
export function safeNext(next: string | null | undefined): string {
  if (
    !next ||
    !(next === "/admin" || next.startsWith("/admin/") || next.startsWith("/admin?")) ||
    next.startsWith("//") ||
    next.includes("\\")
  ) {
    return "/admin";
  }
  if (next === LOGIN_PATH || next.startsWith(`${LOGIN_PATH}?`)) return "/admin";
  return next;
}

/** Returns the path to redirect to, or null to let the request through. */
export function adminRedirect(
  pathname: string,
  search: string,
  authed: boolean,
): string | null {
  const isLogin = pathname === LOGIN_PATH || pathname === `${LOGIN_PATH}/`;
  if (isLogin) return authed ? "/admin" : null;
  if (authed) return null;
  return `${LOGIN_PATH}?next=${encodeURIComponent(pathname + search)}`;
}
