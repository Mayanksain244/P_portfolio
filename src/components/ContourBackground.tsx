/** Decorative topographic contour lines. Uses currentColor at low opacity. */

type Peak = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  seed: number;
  rings: number;
};

const PEAKS: Peak[] = [
  { cx: 880, cy: 300, rx: 70, ry: 45, seed: 1.3, rings: 10 },
  { cx: 260, cy: 560, rx: 55, ry: 35, seed: 4.1, rings: 8 },
  { cx: 1080, cy: 700, rx: 40, ry: 28, seed: 2.2, rings: 6 },
];

function ring(p: Peak, i: number): string {
  const steps = 72;
  const grow = 1 + i * 0.62;
  const pts: string[] = [];
  for (let s = 0; s < steps; s++) {
    const a = (s / steps) * Math.PI * 2;
    const wobble =
      1 +
      0.09 * Math.sin(3 * a + p.seed + i * 0.35) +
      0.05 * Math.sin(5 * a + 2 * p.seed - i * 0.2) +
      0.025 * Math.sin(9 * a + p.seed * 3);
    const x = p.cx + Math.cos(a) * p.rx * grow * wobble;
    const y = p.cy + Math.sin(a) * p.ry * grow * wobble;
    pts.push(`${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `${pts.join("")}Z`;
}

const PATHS = PEAKS.flatMap((p) =>
  Array.from({ length: p.rings }, (_, i) => ring(p, i)),
);

export default function ContourBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-[0.1] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
