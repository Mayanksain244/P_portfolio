import type { ReactNode } from "react";

/**
 * Wrapper that applies the .bg-blueprint utility (defined in globals.css).
 * The grid is drawn in the current text colour at very low opacity.
 */
export default function BlueprintGrid({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={`bg-blueprint ${className}`}>{children}</div>;
}
