// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import SocialLinks from "@/components/SocialLinks";
import type { SocialLink } from "@/content/profile";

afterEach(cleanup);

const wrap = (links: SocialLink[]) => (
  <NextIntlClientProvider locale="en" messages={en}>
    <SocialLinks links={links} />
  </NextIntlClientProvider>
);

describe("SocialLinks", () => {
  it("renders nothing when empty", () => {
    const { container } = render(wrap([]));
    expect(container.innerHTML).toBe("");
  });

  it("renders labelled links with safe external attributes", () => {
    render(
      wrap([
        { platform: "linkedin", url: "https://www.linkedin.com/in/x" },
        { platform: "whatsapp", url: "https://wa.me/910000000000" },
        { platform: "email", url: "a@b.co" },
        { platform: "phone", url: "+91 98765 43210", label: "Call the office" },
      ]),
    );
    const li = screen.getByRole("link", { name: "LinkedIn (opens in new tab)" });
    expect(li.getAttribute("target")).toBe("_blank");
    expect(li.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByRole("link", { name: "WhatsApp (opens in new tab)" })).toBeTruthy();

    const mail = screen.getByRole("link", { name: "Email" });
    expect(mail.getAttribute("href")).toBe("mailto:a@b.co");
    expect(mail.getAttribute("target")).toBeNull();
    const tel = screen.getByRole("link", { name: "Call the office" });
    expect(tel.getAttribute("href")).toBe("tel:+919876543210");
    expect(tel.getAttribute("target")).toBeNull();
  });
});
