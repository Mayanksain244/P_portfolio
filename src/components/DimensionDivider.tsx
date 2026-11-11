/** Section heading styled as an engineering dimension line: |<---- TITLE ---->| */

function End({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="14"
      height="18"
      viewBox="0 0 14 18"
      className={`shrink-0 ${flip ? "-scale-x-100" : ""}`}
      fill="currentColor"
      stroke="currentColor"
    >
      {/* tick mark */}
      <line x1="0.5" y1="1" x2="0.5" y2="17" strokeWidth="1" />
      {/* arrowhead */}
      <polygon points="1,9 10,5.5 10,12.5" stroke="none" />
    </svg>
  );
}

export default function DimensionDivider({
  title,
  as: Tag = "h2",
  className = "",
  id,
  onDark = false,
}: {
  title: string;
  as?: "h2" | "h3" | "p";
  className?: string;
  id?: string;
  /** Force paper-coloured ink for use on navy bands in both themes. */
  onDark?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 ${
        onDark ? "text-paper" : "text-navy dark:text-paper"
      } ${className}`}
    >
      <End />
      <span
        aria-hidden="true"
        className="-ml-px h-0.5 min-w-4 flex-1 bg-current opacity-80"
      />
      <Tag id={id} className="dim-title mx-2 max-w-[70%] text-center text-xs font-semibold sm:mx-4 sm:text-sm">
        {title}
      </Tag>
      <span
        aria-hidden="true"
        className="-mr-px h-0.5 min-w-4 flex-1 bg-current opacity-80"
      />
      <End flip />
    </div>
  );
}
