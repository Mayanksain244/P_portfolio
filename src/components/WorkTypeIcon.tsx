import type { WorkType } from "@/content/works";

/** Simple line icons for each project type. Decorative. */
export default function WorkTypeIcon({
  type,
  className = "",
}: {
  type: WorkType;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === "road" && (
        <>
          <path d="M16 42 21 6M32 42 27 6" />
          <path d="M24 38v-4M24 28v-4M24 18v-4" />
        </>
      )}
      {type === "bridge" && (
        <>
          <path d="M3 24h42M3 30h42" />
          <path d="M9 30v10M39 30v10" />
          <path d="M9 30c5-10 11-10 15 0 4-10 10-10 15 0" />
        </>
      )}
      {type === "building" && (
        <>
          <path d="M8 42V18l16-10 16 10v24z" />
          <path d="M18 42V30h12v12M14 22h4M30 22h4" />
        </>
      )}
      {type === "protection" && (
        <>
          <path d="M6 40h36M8 40V30h12v10M20 30V20h12v10M32 30v10M32 20V12h10v28" />
          <path d="M8 34h12M20 25h12M32 16h10" />
        </>
      )}
      {type === "other" && (
        <>
          <circle cx="24" cy="24" r="14" />
          <path d="M24 10v28M10 24h28" />
          <path d="m18 30 4-8 8-4-4 8z" />
        </>
      )}
    </svg>
  );
}
