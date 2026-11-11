import "server-only";
import nodemailer from "nodemailer";
import { stripHeaderChars } from "@/lib/contact/emailTemplate";

let warned = false;

export type MailInput = {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
};

/** Recipients from CONTACT_TO (comma-separated). */
export function recipients(raw = process.env.CONTACT_TO): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => stripHeaderChars(s))
    .filter(Boolean);
}

/**
 * Sends the notification via Gmail SMTP. Returns "skipped" (after one warning)
 * when the Gmail env vars are missing; throws if SMTP fails.
 */
export async function sendContactMail(input: MailInput): Promise<"sent" | "skipped"> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  const to = recipients();
  if (!user || !pass || to.length === 0) {
    if (!warned) {
      warned = true;
      console.warn(
        "[mailer] GMAIL_USER / GMAIL_APP_PASSWORD / CONTACT_TO not set. Mail skipped; messages are still saved.",
      );
    }
    return "skipped";
  }
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transport.sendMail({
    from: `"Portfolio Contact" <${stripHeaderChars(user)}>`,
    to,
    replyTo: stripHeaderChars(input.replyTo),
    subject: stripHeaderChars(input.subject),
    html: input.html,
    text: input.text,
  });
  return "sent";
}
