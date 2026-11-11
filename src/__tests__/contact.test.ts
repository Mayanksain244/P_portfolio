import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_AGE_MS,
  MIN_FILL_MS,
  countUrls,
  hasTooManyUrls,
  signFormToken,
  verifyFormToken,
} from "@/lib/contact/antispam";
import {
  buildContactEmail,
  combinedSubject,
  emailSubject,
  referenceNumber,
  stripHeaderChars,
} from "@/lib/contact/emailTemplate";
import { parseContact } from "@/lib/contact/schema";

const valid = {
  name: "Asha Rawat",
  email: "asha@example.com",
  phone: "+91 98765-43210",
  purpose: "work",
  subject: "Road repair",
  message: "The road near the school needs repair before the monsoon.",
  consent: "on",
};

describe("contact schema", () => {
  it("accepts a valid submission and trims", () => {
    const r = parseContact({ ...valid, name: "  Asha Rawat  " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.name).toBe("Asha Rawat");
  });

  it("accepts the minimum (optional fields empty)", () => {
    expect(parseContact({ ...valid, phone: "", subject: "" }).ok).toBe(true);
  });

  it.each([
    ["name", { name: "A" }, "name"],
    ["name long", { name: "x".repeat(81) }, "name"],
    ["email", { email: "nope" }, "email"],
    ["email empty", { email: "" }, "email"],
    ["phone letters", { phone: "98abc" }, "phone"],
    ["phone short", { phone: "123456" }, "phone"],
    ["phone long", { phone: "1".repeat(16) }, "phone"],
    ["purpose", { purpose: "spam" }, "purpose"],
    ["subject", { subject: "s".repeat(121) }, "subject"],
    ["message short", { message: "too short" }, "message"],
    ["message long", { message: "m".repeat(2001) }, "message"],
    ["consent", { consent: "" }, "consent"],
  ])("rejects invalid %s", (_label, patch, field) => {
    const r = parseContact({ ...valid, ...patch });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveProperty(field);
  });

  it("returns i18n error keys", () => {
    const r = parseContact({ ...valid, message: "short" });
    expect(!r.ok && r.errors.message).toBe("messageShort");
  });
});

describe("email template", () => {
  const base = {
    id: "1b2c3d4e-aaaa-bbbb-cccc-111122223333",
    name: "Asha Rawat",
    email: "asha@example.com",
    phone: "+91 98765 43210",
    purpose: "work" as const,
    subject: "Road repair",
    message: "Line one\nLine two",
    locale: "hi",
    receivedAt: new Date("2026-11-11T06:30:00Z"),
  };

  it("contains every field, IST time and the reference", () => {
    const { html, text, subject } = buildContactEmail(base);
    for (const v of ["Asha Rawat", "asha@example.com", "+91 98765 43210", "Public work", "Road repair", "Line one", "Hindi", "1B2C3D4E", "12:00 pm IST"]) {
      expect(html).toContain(v);
      expect(text).toContain(v);
    }
    expect(html).toContain("mailto:asha@example.com");
    expect(html).toContain("Reply");
    expect(html).toContain("Line one<br>Line two");
    expect(subject).toBe("New enquiry: [Public work] Road repair");
  });

  it("escapes HTML and quotes in every user value", () => {
    const evil = `<script>alert("x")</script>'`;
    const { html } = buildContactEmail({
      ...base,
      name: evil,
      phone: evil,
      subject: evil,
      message: evil,
      email: `a"onmouseover="x@e.com`,
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&#39;");
    expect(html).not.toContain(`"onmouseover="`);
  });

  it("subject falls back to the first 40 chars of the message", () => {
    const s = emailSubject("general", "", "x".repeat(100));
    expect(s).toBe(`New enquiry: [General] ${"x".repeat(40)}`);
  });

  it("combines purpose and subject for the database", () => {
    expect(combinedSubject("work", "Road")).toBe("[Public work] Road");
    expect(combinedSubject("media", "")).toBe("[Media & press]");
  });

  it("makes a reference from the first 8 chars of the uuid", () => {
    expect(referenceNumber(base.id)).toBe("1B2C3D4E");
  });
});

describe("header injection", () => {
  it("strips CR/LF and control characters", () => {
    expect(stripHeaderChars("Hi\r\nBcc: evil@x.com")).toBe("Hi Bcc: evil@x.com");
    expect(stripHeaderChars("a\nb\rc\u0000d")).not.toMatch(/[\r\n\u0000]/);
  });

  it("keeps CR/LF out of the email subject", () => {
    const { subject } = buildContactEmail({
      id: "abcdef12-0000-0000-0000-000000000000",
      name: "n",
      email: "a@b.co",
      purpose: "other",
      subject: "Hello\r\nBcc: evil@x.com",
      message: "m".repeat(30),
      locale: "en",
      receivedAt: new Date(),
    });
    expect(subject).not.toMatch(/[\r\n]/);
  });
});

describe("form token signer", () => {
  const secret = "test-secret-0123456789";
  const t0 = 1_800_000_000_000;

  it("accepts a token aged between 3s and 2h", () => {
    const tok = signFormToken(secret, t0);
    expect(verifyFormToken(tok, secret, t0 + MIN_FILL_MS + 1)).toBe("ok");
    expect(verifyFormToken(tok, secret, t0 + MAX_AGE_MS - 1)).toBe("ok");
  });

  it("rejects too fast and too old", () => {
    const tok = signFormToken(secret, t0);
    expect(verifyFormToken(tok, secret, t0 + 1000)).toBe("tooFast");
    expect(verifyFormToken(tok, secret, t0 + MAX_AGE_MS + 1)).toBe("expired");
  });

  it("rejects forged, tampered and missing tokens", () => {
    const tok = signFormToken(secret, t0);
    const [ts, mac] = tok.split(".");
    expect(verifyFormToken(`${Number(ts) - 60_000}.${mac}`, secret, t0 + 10_000)).toBe("invalid");
    expect(verifyFormToken(tok, "other-secret", t0 + 10_000)).toBe("invalid");
    expect(verifyFormToken(`${ts}.${"0".repeat(64)}`, secret, t0 + 10_000)).toBe("invalid");
    expect(verifyFormToken("", secret)).toBe("invalid");
    expect(verifyFormToken(undefined, secret)).toBe("invalid");
  });
});

describe("URL count", () => {
  it("counts http, https and www links", () => {
    expect(countUrls("see https://a.com and http://b.org/x?y=1 and www.c.in.")).toBe(3);
    expect(countUrls("no links here, example dot com")).toBe(0);
  });
  it("flags more than 3", () => {
    expect(hasTooManyUrls("https://a.com https://b.com https://c.com")).toBe(false);
    expect(hasTooManyUrls("https://a.com https://b.com https://c.com https://d.com")).toBe(true);
  });
});

// ---- server action ----
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const sendContactMail = vi.fn();
const checkAndRecord = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "1.2.3.4" }) }));
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
vi.mock("@/lib/supabase/server", () => ({ getAdminClient: () => ({ from }) }));
vi.mock("@/lib/mailer", () => ({ sendContactMail: (...a: unknown[]) => sendContactMail(...a) }));
vi.mock("@/lib/rateLimit", () => ({
  checkAndRecord: (...a: unknown[]) => checkAndRecord(...a),
  clientIp: () => "1.2.3.4",
  hashKey: (ip: string) => `h(${ip})`,
}));

function formData(over: Record<string, string> = {}, ageMs = 10_000) {
  const fd = new FormData();
  const base: Record<string, string> = {
    ...valid,
    website: "",
    locale: "en",
    ft: signFormToken(process.env.AUTH_SECRET!, Date.now() - ageMs),
  };
  for (const [k, v] of Object.entries({ ...base, ...over })) fd.set(k, v);
  return fd;
}

describe("submitContact action", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "unit-test-secret-unit-test-secret";
    insert.mockReset().mockResolvedValue({ error: null });
    from.mockClear();
    sendContactMail.mockReset().mockResolvedValue("sent");
    checkAndRecord.mockReset().mockResolvedValue({ allowed: true, remaining: 2 });
    revalidatePath.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("honeypot: fake success, no DB, no mail", async () => {
    const { submitContact } = await import("@/app/[locale]/contact/actions");
    const r = await submitContact(formData({ website: "http://spam.example" }));
    expect(r.ok).toBe(true);
    expect(from).not.toHaveBeenCalled();
    expect(sendContactMail).not.toHaveBeenCalled();
    expect(checkAndRecord).not.toHaveBeenCalled();
  });

  it("too-fast submission: fake success, nothing saved", async () => {
    const { submitContact } = await import("@/app/[locale]/contact/actions");
    const r = await submitContact(formData({}, 500));
    expect(r.ok).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("saves, mails and revalidates on the happy path", async () => {
    const { submitContact } = await import("@/app/[locale]/contact/actions");
    const r = await submitContact(formData());
    expect(r.ok).toBe(true);
    expect(from).toHaveBeenCalledWith("messages");
    const row = insert.mock.calls[0][0];
    expect(row).toMatchObject({
      name: "Asha Rawat",
      email: "asha@example.com",
      subject: "[Public work] Road repair",
      ip_hash: "h(1.2.3.4)",
    });
    expect(r.ok && r.ref).toBe(String(row.id).replace(/-/g, "").slice(0, 8).toUpperCase());
    expect(sendContactMail).toHaveBeenCalledOnce();
    expect(sendContactMail.mock.calls[0][0].replyTo).toBe("asha@example.com");
    expect(revalidatePath).toHaveBeenCalledWith("/admin", "layout");
  });

  it("returns field errors for invalid input", async () => {
    const { submitContact } = await import("@/app/[locale]/contact/actions");
    const r = await submitContact(formData({ email: "bad" }));
    expect(r).toMatchObject({ ok: false, kind: "validation" });
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects more than 3 URLs", async () => {
    const { submitContact } = await import("@/app/[locale]/contact/actions");
    const msg = "buy now https://a.com https://b.com https://c.com https://d.com please";
    const r = await submitContact(formData({ message: msg }));
    expect(r).toMatchObject({ ok: false, kind: "validation", errors: { message: "links" } });
  });

  it("reports rate limiting", async () => {
    checkAndRecord.mockResolvedValue({ allowed: false, remaining: 0 });
    const { submitContact } = await import("@/app/[locale]/contact/actions");
    const r = await submitContact(formData());
    expect(r).toEqual({ ok: false, kind: "rateLimit" });
    expect(checkAndRecord).toHaveBeenCalledWith("contact", "h(1.2.3.4)", 3, 3600);
    expect(from).not.toHaveBeenCalled();
  });

  it("still succeeds when only the mail fails", async () => {
    sendContactMail.mockRejectedValue(new Error("smtp down"));
    const { submitContact } = await import("@/app/[locale]/contact/actions");
    expect((await submitContact(formData())).ok).toBe(true);
  });

  it("emails anyway when the insert fails, errors only if both fail", async () => {
    insert.mockResolvedValue({ error: { code: "x", message: "boom" } });
    const { submitContact } = await import("@/app/[locale]/contact/actions");
    expect((await submitContact(formData())).ok).toBe(true);
    expect(sendContactMail).toHaveBeenCalled();
    sendContactMail.mockResolvedValue("skipped");
    expect(await submitContact(formData())).toEqual({ ok: false, kind: "server" });
  });
});
