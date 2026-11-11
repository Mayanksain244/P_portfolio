import { PURPOSE_LABEL_EN, type Purpose } from "./schema";

export type ContactEmailInput = {
  /** Message uuid; the first 8 chars (uppercased) are the reference number. */
  id: string;
  name: string;
  email: string;
  phone?: string;
  purpose: Purpose;
  subject?: string;
  message: string;
  locale: string;
  receivedAt: Date;
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Removes CR/LF and other control characters (C0, DEL, U+2028/9) so a value can never inject extra headers. */
export function stripHeaderChars(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    out += c < 32 || c === 127 || c === 0x2028 || c === 0x2029 ? " " : ch;
  }
  return out.split(" ").filter(Boolean).join(" ");
}

export function referenceNumber(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function formatIst(d: Date): string {
  return (
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d) + " IST"
  );
}

/** "[Public work] subject": stored in `messages.subject`. */
export function combinedSubject(purpose: Purpose, subject?: string): string {
  const label = `[${PURPOSE_LABEL_EN[purpose]}]`;
  const s = stripHeaderChars(subject ?? "");
  return s ? `${label} ${s}` : label;
}

export function emailSubject(
  purpose: Purpose,
  subject: string | undefined,
  message: string,
): string {
  const s = stripHeaderChars(subject ?? "");
  const tail = s || stripHeaderChars(message).slice(0, 40);
  return `New enquiry: [${PURPOSE_LABEL_EN[purpose]}] ${tail}`.trim();
}

const NAVY = "#0F2A44";
const PAPER = "#F4EFE6";
const MARIGOLD = "#E0A526";

/** Pure: builds the notification email (subject, HTML with inline styles and tables, plain text). */
export function buildContactEmail(i: ContactEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const ref = referenceNumber(i.id);
  const when = formatIst(i.receivedAt);
  const subject = emailSubject(i.purpose, i.subject, i.message);
  const lang = i.locale === "hi" ? "Hindi (hi)" : "English (en)";
  const replySubject = `Re: ${stripHeaderChars(i.subject ?? "") || "your enquiry"} [${ref}]`;
  const mailto = `mailto:${stripHeaderChars(i.email)}?subject=${encodeURIComponent(replySubject)}`;

  const rows: [string, string][] = [
    ["Reference", ref],
    ["Name", i.name],
    ["Email", i.email],
    ["Phone", i.phone || "-"],
    ["Purpose", PURPOSE_LABEL_EN[i.purpose]],
    ["Subject", i.subject || "-"],
    ["Language", lang],
    ["Received", when],
  ];

  const labelStyle =
    "padding:8px 12px;border-bottom:1px solid #d9d2c3;width:110px;font:600 11px Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#4a4a4a;vertical-align:top";
  const valueStyle =
    "padding:8px 12px;border-bottom:1px solid #d9d2c3;font:14px Arial,Helvetica,sans-serif;color:#1b1b1b;vertical-align:top";
  const rowHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="${labelStyle}">${escapeHtml(k)}</td><td style="${valueStyle}">${escapeHtml(v)}</td></tr>`,
    )
    .join("");

  const messageHtml = escapeHtml(i.message).replace(/\r?\n/g, "<br>");

  const html =
    `<!doctype html><html><body style="margin:0;padding:0;background:#e9e2d3">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9e2d3"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${PAPER};border:1px solid ${NAVY}">` +
    `<tr><td style="background:${NAVY};padding:16px 20px;border-bottom:4px solid ${MARIGOLD}">` +
    `<div style="font:600 11px Arial,Helvetica,sans-serif;letter-spacing:2px;color:${MARIGOLD};text-transform:uppercase">FORM No. SSS/01 &middot; Inquiry</div>` +
    `<div style="font:600 20px Georgia,'Times New Roman',serif;color:${PAPER};margin-top:4px">New enquiry from the portfolio site</div>` +
    `</td></tr>` +
    `<tr><td style="padding:16px 8px 0 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowHtml}</table></td></tr>` +
    `<tr><td style="padding:16px 20px 4px 20px;font:600 11px Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#4a4a4a">Message</td></tr>` +
    `<tr><td style="padding:0 20px 20px 20px"><div style="background:#ffffff;border-left:4px solid ${MARIGOLD};padding:14px 16px;font:15px/1.55 Arial,Helvetica,sans-serif;color:#1b1b1b">${messageHtml}</div></td></tr>` +
    `<tr><td align="left" style="padding:0 20px 24px 20px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${MARIGOLD}">` +
    `<a href="${escapeHtml(mailto)}" style="display:inline-block;padding:12px 28px;font:700 14px Arial,Helvetica,sans-serif;color:${NAVY};text-decoration:none">Reply</a>` +
    `</td></tr></table></td></tr>` +
    `<tr><td style="background:${NAVY};padding:10px 20px;font:11px Arial,Helvetica,sans-serif;color:${PAPER}">Ref ${escapeHtml(ref)} &middot; ${escapeHtml(when)}. Sent by the contact form; no automatic reply was sent to the sender.</td></tr>` +
    `</table></td></tr></table></body></html>`;

  const text =
    `NEW ENQUIRY (FORM No. SSS/01)\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\nMessage:\n${i.message}\n\nReply: ${mailto}\n`;

  return { subject, html, text };
}
