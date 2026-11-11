"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { hasTooManyUrls, signFormToken, verifyFormToken } from "@/lib/contact/antispam";
import {
  buildContactEmail,
  combinedSubject,
  referenceNumber,
} from "@/lib/contact/emailTemplate";
import { parseContact, type FieldErrors } from "@/lib/contact/schema";
import { sendContactMail } from "@/lib/mailer";
import { checkAndRecord, clientIp, hashKey } from "@/lib/rateLimit";
import { getAdminClient } from "@/lib/supabase/server";

export type ContactResult =
  | { ok: true; ref: string }
  | { ok: false; kind: "validation"; errors: FieldErrors }
  | { ok: false; kind: "rateLimit" | "server" };

const RATE = { bucket: "contact", limit: 3, windowSec: 3600 } as const;

/** Signed render timestamp; the browser asks for one when the form mounts. */
export async function issueFormToken(): Promise<string> {
  try {
    return signFormToken(process.env.AUTH_SECRET ?? "");
  } catch (e) {
    console.error("[contact] could not sign form token:", e instanceof Error ? e.message : e);
    return "";
  }
}

function fakeSuccess(): ContactResult {
  return { ok: true, ref: referenceNumber(randomUUID()) };
}

export async function submitContact(formData: FormData): Promise<ContactResult> {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };

  // 1a. Honeypot: bots fill it. Pretend success, do nothing.
  if (get("website").trim() !== "") return fakeSuccess();

  // 1b. Signed render timestamp: forged, too fast (<3s) or too old (>2h) gets a fake success.
  const check = verifyFormToken(get("ft"), process.env.AUTH_SECRET ?? "");
  if (check !== "ok") {
    if (check === "invalid") console.warn("[contact] missing or invalid form token; dropped.");
    return fakeSuccess();
  }

  // 2. Validate (trims everything).
  const parsed = parseContact(Object.fromEntries(formData.entries()));
  if (!parsed.ok) return { ok: false, kind: "validation", errors: parsed.errors };
  const data = parsed.data;

  // 1c. More than 3 URLs in the text is treated as spam.
  if (hasTooManyUrls(`${data.message}\n${data.subject}`)) {
    return { ok: false, kind: "validation", errors: { message: "links" } };
  }

  // 1d. Rate limit: 3 per hour per hashed IP (fails open if the table is missing).
  const ip = clientIp(await headers());
  const ipHash = hashKey(ip);
  const rl = await checkAndRecord(RATE.bucket, ipHash, RATE.limit, RATE.windowSec);
  if (!rl.allowed) return { ok: false, kind: "rateLimit" };

  const locale = hasLocale(routing.locales, get("locale")) ? get("locale") : routing.defaultLocale;
  const id = randomUUID();
  const ref = referenceNumber(id);

  // 3. Save.
  let saved = false;
  try {
    const db = getAdminClient();
    if (!db) {
      console.error("[contact] database not configured; message not saved.");
    } else {
      const { error } = await db.from("messages").insert({
        id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: combinedSubject(data.purpose, data.subject),
        body: data.message,
        ip_hash: ipHash,
      });
      if (error) console.error("[contact] insert failed:", error.code, error.message);
      else saved = true;
    }
  } catch (e) {
    console.error("[contact] insert threw:", e instanceof Error ? e.message : e);
  }

  // 4. Notify. Never auto-reply to the sender.
  let mailed = false;
  try {
    const mail = buildContactEmail({
      id,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      purpose: data.purpose,
      subject: data.subject || undefined,
      message: data.message,
      locale,
      receivedAt: new Date(),
    });
    mailed = (await sendContactMail({ ...mail, replyTo: data.email })) === "sent";
  } catch (e) {
    console.error("[contact] email failed:", e instanceof Error ? e.message : e);
  }

  // 5. Refresh the admin inbox count.
  if (saved) {
    try {
      revalidatePath("/admin", "layout");
    } catch {
      /* not fatal */
    }
  }

  if (!saved && !mailed) return { ok: false, kind: "server" };
  return { ok: true, ref };
}
