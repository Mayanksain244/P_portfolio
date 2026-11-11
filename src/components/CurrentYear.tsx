"use client";

/**
 * The current year, computed in the browser so a statically cached page never
 * shows a stale year. suppressHydrationWarning covers the rare year-boundary
 * mismatch between server HTML and the client.
 */
export default function CurrentYear() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}
