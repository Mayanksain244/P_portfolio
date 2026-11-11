"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { idSchema } from "@/lib/admin/schemas";
import { dbFail, fail, type ActionResult } from "@/lib/admin/result";
import { adminDb } from "@/lib/admin/server";

export async function setMessageRead(id: unknown, read: unknown): Promise<ActionResult> {
  await requireAdmin();
  const i = idSchema.safeParse(id);
  if (!i.success || typeof read !== "boolean") return fail("Invalid request.");
  const db = adminDb();
  if (!db) return fail("The database is not configured.");
  const { error } = await db.from("messages").update({ read }).eq("id", i.data);
  if (error) return dbFail("setMessageRead", error);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteMessage(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const i = idSchema.safeParse(id);
  if (!i.success) return fail("Invalid request.");
  const db = adminDb();
  if (!db) return fail("The database is not configured.");
  const { error } = await db.from("messages").delete().eq("id", i.data);
  if (error) return dbFail("deleteMessage", error, "Could not delete the message.");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
