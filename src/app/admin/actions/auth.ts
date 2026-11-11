"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/auth/credentials";
import { safeNext } from "@/lib/auth/routing";
import { createSession, destroySession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/admin/schemas";
import { clientIp, hashKey, isLimited, recordHit } from "@/lib/rateLimit";

export type LoginState = { error?: string } | null;

const GENERIC = "Incorrect username or password.";
const LIMIT = 5;
const WINDOW_SEC = 15 * 60;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    await sleep(400);
    return { error: parsed.error.issues[0]?.message ?? GENERIC };
  }

  const key = hashKey(clientIp(await headers()));
  if (await isLimited("login", key, LIMIT, WINDOW_SEC)) {
    await sleep(400);
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const ok = await verifyCredentials(parsed.data.username, parsed.data.password);
  if (!ok) {
    await recordHit("login", key);
    await sleep(400);
    return { error: GENERIC };
  }

  try {
    await createSession();
  } catch (e) {
    console.error("[admin] createSession failed:", e instanceof Error ? e.message : e);
    return { error: "Sign-in is not configured on the server." };
  }
  redirect(safeNext(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
