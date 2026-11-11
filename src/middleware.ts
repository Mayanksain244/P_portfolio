import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

// Excludes /admin (English-only, added in Phase 4), /api, Next internals and
// anything with a file extension (static files).
export const config = {
  matcher: ["/((?!admin(?:/|$)|api(?:/|$)|_next|_vercel|.*\..*).*)"],
};
