import { z } from "zod";

/**
 * Shared by the browser (inline validation) and the server action.
 * Issue messages are i18n keys under `contact.errors`.
 */

export const PURPOSES = ["general", "work", "media", "personal", "other"] as const;
export type Purpose = (typeof PURPOSES)[number];

/** English labels used in the admin inbox subject and the notification email. */
export const PURPOSE_LABEL_EN: Record<Purpose, string> = {
  general: "General",
  work: "Public work",
  media: "Media & press",
  personal: "Personal",
  other: "Other",
};

export const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  subjectMax: 120,
  messageMin: 20,
  messageMax: 2000,
  maxUrls: 3,
} as const;

const phoneOk = (v: string) => {
  if (v === "") return true;
  if (!/^\+?[\d\s-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
};

export const contactSchema = z.object({
  name: z.string().trim().min(LIMITS.nameMin, "name").max(LIMITS.nameMax, "name"),
  email: z.string().trim().max(254, "email").pipe(z.email({ error: "email" })),
  phone: z.string().trim().refine(phoneOk, "phone"),
  purpose: z.enum(PURPOSES, { error: "purpose" }),
  subject: z.string().trim().max(LIMITS.subjectMax, "subject"),
  message: z
    .string()
    .trim()
    .min(LIMITS.messageMin, "messageShort")
    .max(LIMITS.messageMax, "messageLong"),
  consent: z.literal(true, { error: "consent" }),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

/** Field order as laid out in the form (used to focus the first invalid field). */
export const FIELD_ORDER: ContactField[] = [
  "name",
  "email",
  "phone",
  "purpose",
  "subject",
  "message",
  "consent",
];

export type FieldErrors = Partial<Record<ContactField, string>>;

/** Coerces raw form values (strings / checkbox state) and validates. */
export function parseContact(
  raw: Record<string, unknown>,
): { ok: true; data: ContactInput } | { ok: false; errors: FieldErrors } {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const consent = raw.consent === true || raw.consent === "on" || raw.consent === "true";
  const res = contactSchema.safeParse({
    name: str(raw.name),
    email: str(raw.email),
    phone: str(raw.phone),
    purpose: str(raw.purpose),
    subject: str(raw.subject),
    message: str(raw.message),
    consent,
  });
  if (res.success) return { ok: true, data: res.data };
  const errors: FieldErrors = {};
  for (const issue of res.error.issues) {
    const field = issue.path[0] as ContactField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
