import { useTranslations } from "next-intl";
import type { SocialLink, SocialPlatform } from "@/content/profile";

const FILL = { fill: "currentColor", stroke: "none" } as const;
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Icon({ platform }: { platform: SocialPlatform }) {
  let body: React.ReactNode;
  let style: React.SVGProps<SVGSVGElement> = FILL;
  switch (platform) {
    case "linkedin":
      body = (
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11.5H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.82-2.05 3.75-2.05 4 0 4.75 2.63 4.75 6.05v5.9h-4v-5.23c0-1.25-.02-2.85-1.74-2.85-1.74 0-2 1.36-2 2.76v5.32h-4z" />
      );
      break;
    case "facebook":
      body = (
        <path d="M13.5 21v-8h2.7l.5-3.2h-3.2V7.9c0-.9.4-1.7 1.8-1.7h1.5V3.4S15.5 3.2 14.3 3.2c-2.6 0-4.3 1.6-4.3 4.4v2.2H7.3V13H10v8z" />
      );
      break;
    case "x":
      body = (
        <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.2 4.7H5.4z" />
      );
      break;
    case "instagram":
      style = STROKE;
      body = (
        <>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </>
      );
      break;
    case "youtube":
      body = (
        <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z" />
      );
      break;
    case "whatsapp":
      style = STROKE;
      body = (
        <>
          <path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6z" />
          <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z" />
        </>
      );
      break;
    case "email":
      style = STROKE;
      body = (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
        </>
      );
      break;
    case "phone":
      style = STROKE;
      body = (
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
      );
      break;
  }
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      {...style}
    >
      {body}
    </svg>
  );
}

function hrefFor(l: SocialLink): string {
  const url = l.url.trim();
  if (l.platform === "email" && !/^mailto:/i.test(url)) return `mailto:${url}`;
  if (l.platform === "phone" && !/^tel:/i.test(url)) return `tel:${url.replace(/[^\d+]/g, "")}`;
  return url;
}

/**
 * Round icon links (44px touch targets). Renders nothing when there are no links.
 * `tone="dark"` is for navy backgrounds (footer).
 */
export default function SocialLinks({
  links,
  tone = "light",
  className = "",
}: {
  links: SocialLink[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const t = useTranslations("social");
  if (links.length === 0) return null;

  const colors =
    tone === "dark"
      ? "border-paper/50 text-paper hover:border-marigold hover:text-marigold"
      : "border-navy/40 text-navy hover:border-marigold-600 hover:bg-marigold/15 dark:border-paper/50 dark:text-paper dark:hover:border-marigold dark:hover:text-marigold";

  return (
    <ul className={`flex flex-wrap gap-3 ${className}`}>
      {links.map((l) => {
        const internal = l.platform === "email" || l.platform === "phone";
        const name = l.label || t(`platforms.${l.platform}`);
        const label = internal ? name : `${name} ${t("newTab")}`;
        return (
          <li key={`${l.platform}-${l.url}`}>
            <a
              href={hrefFor(l)}
              aria-label={label}
              title={name}
              {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${colors}`}
            >
              <Icon platform={l.platform} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
