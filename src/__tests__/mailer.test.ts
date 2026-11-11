import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn(async () => ({}));
const createTransport = vi.fn((opts?: unknown) => (void opts, { sendMail }));
vi.mock("nodemailer", () => ({ default: { createTransport: (...a: unknown[]) => createTransport(...a) } }));

import { sendContactMail } from "@/lib/mailer";

const input = { subject: "Hi", html: "<p>x</p>", text: "x", replyTo: "a@b.co" };

describe("sendContactMail app password", () => {
  beforeEach(() => {
    sendMail.mockClear();
    createTransport.mockClear();
    vi.stubEnv("GMAIL_USER", "me@gmail.com");
    vi.stubEnv("CONTACT_TO", "me@gmail.com");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("strips all whitespace from the app password", async () => {
    vi.stubEnv("GMAIL_APP_PASSWORD", " abcd efgh\tijkl  mnop \n");
    expect(await sendContactMail(input)).toBe("sent");
    const opts = createTransport.mock.calls[0][0] as { auth: { user: string; pass: string } };
    expect(opts.auth.pass).toBe("abcdefghijklmnop");
  });

  it("treats a whitespace-only password as missing", async () => {
    vi.stubEnv("GMAIL_APP_PASSWORD", "   ");
    expect(await sendContactMail(input)).toBe("skipped");
    expect(createTransport).not.toHaveBeenCalled();
  });
});
