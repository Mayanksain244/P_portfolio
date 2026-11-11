import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

import Monogram from "@/components/Monogram";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-900 px-4 py-10 text-paper"
    >
      <div aria-hidden="true" className="bg-blueprint absolute inset-0" />
      <div className="relative w-full max-w-sm rounded-lg border border-paper/20 bg-navy p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Monogram className="h-14 w-14 text-paper" />
          <h1 className="font-heading text-2xl">Site Office — Admin</h1>
          <p className="text-sm text-paper/75">Sign in to manage the Site Diary and messages.</p>
        </div>
        <LoginForm next={typeof next === "string" ? next : ""} />
      </div>
    </main>
  );
}
