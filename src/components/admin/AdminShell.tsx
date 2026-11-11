"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Monogram from "@/components/Monogram";
import ThemeToggle from "@/components/ThemeToggle";
import { logoutAction } from "@/app/admin/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/albums", label: "Albums" },
  { href: "/admin/messages", label: "Messages" },
];

export default function AdminShell({
  unread,
  children,
}: {
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const items = (
    <ul className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <li key={n.href}>
            <Link
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 items-center justify-between rounded px-3 text-base font-semibold ${
                active ? "bg-paper text-navy" : "text-paper hover:bg-navy-700"
              }`}
            >
              {n.label}
              {n.href === "/admin/messages" && unread > 0 && (
                <span
                  className="rounded-full bg-marigold px-2 py-0.5 text-xs font-bold text-navy"
                  aria-label={`${unread} unread`}
                >
                  {unread}
                </span>
              )}
            </Link>
          </li>
        );
      })}
      <li>
        <a
          href="/en"
          target="_blank"
          rel="noopener"
          className="flex min-h-12 items-center rounded px-3 text-base font-semibold text-paper hover:bg-navy-700"
        >
          View site ↗
        </a>
      </li>
      <li>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex min-h-12 w-full items-center rounded px-3 text-left text-base font-semibold text-paper hover:bg-navy-700"
          >
            Log out
          </button>
        </form>
      </li>
    </ul>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-navy-900 px-4 py-2 text-paper md:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Monogram className="h-8 w-8 text-paper" />
          <span className="font-heading text-lg">Admin</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-paper" />
          <button
            type="button"
            className="adm-btn adm-btn-sm text-paper"
            style={{ color: "var(--color-paper)", borderColor: "rgba(244,239,230,.5)" }}
            aria-expanded={open}
            aria-controls="admin-nav-mobile"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>
      {open && (
        <nav
          id="admin-nav-mobile"
          aria-label="Admin"
          className="sticky top-[3.5rem] z-30 bg-navy-900 px-3 pb-3 text-paper shadow-lg md:hidden"
        >
          {items}
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-navy-900 p-4 text-paper md:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-3">
          <Monogram className="h-10 w-10 text-paper" />
          <span>
            <span className="block font-heading text-xl leading-tight">Admin</span>
            <span className="block text-xs uppercase tracking-widest text-paper/70">Site Office</span>
          </span>
        </Link>
        <nav aria-label="Admin" className="flex-1">
          {items}
        </nav>
        <div className="flex items-center justify-between border-t border-paper/20 pt-3 text-sm text-paper/70">
          <span>Theme</span>
          <ThemeToggle className="text-paper" />
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 sm:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
