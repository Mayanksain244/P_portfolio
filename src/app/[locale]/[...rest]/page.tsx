import { notFound } from "next/navigation";

// Catch-all so unknown URLs under a locale render [locale]/not-found.tsx
// (inside the locale layout) with a proper 404 status.
export default function CatchAllPage() {
  notFound();
}
