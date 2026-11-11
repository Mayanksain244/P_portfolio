/** Monogram: a bridge arch beneath a mountain peak. */
export default function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="20" cy="20" r="18.5" />
      {/* mountain peak */}
      <path d="M8 24 L16 12 L20.5 18.5 L24 14 L32 24" />
      {/* bridge deck and arch */}
      <path d="M7 27 H33" />
      <path d="M10 27 Q20 16.5 30 27" stroke="var(--color-marigold)" />
      <path d="M15 27 V30 M20 27 V30 M25 27 V30" strokeWidth="1.2" />
    </svg>
  );
}
