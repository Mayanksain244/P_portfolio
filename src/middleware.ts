import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { adminRedirect } from "./lib/auth/routing";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth/token";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const authed = await verifySessionToken(
      request.cookies.get(SESSION_COOKIE)?.value,
    );
    const target = adminRedirect(pathname, search, authed);
    if (target) return NextResponse.redirect(new URL(target, request.url));
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  return intl(request);
}

// /admin/** is auth-checked above; the second pattern is the public next-intl
// matcher (excludes /admin, /api, Next internals and static files).
export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!admin(?:/|$)|api(?:/|$)|_next|_vercel|.*\..*).*)",
  ],
};
