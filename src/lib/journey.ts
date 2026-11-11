export type Pt = { x: number; y: number };

export type Arc = {
  /** SVG path for the quadratic Bezier from `from` to `to`. */
  d: string;
  control: Pt;
  /** Point at the chevron parameter t of the curve. */
  mid: Pt;
  /** Direction of travel at that point, in degrees (SVG, y down). */
  angle: number;
};

/**
 * Quadratic Bezier between two points, bowed perpendicular to the chord.
 * `side` is +1 or -1; `bow` is the control-point offset as a fraction of chord length.
 */
export function buildArc(
  a: Pt,
  b: Pt,
  side: 1 | -1,
  bow = 0.22,
  /** Curve parameter for the direction chevron (0.5 = midpoint). */
  t = 0.5,
): Arc {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Unit normal to the chord (rotate 90deg).
  const nx = -dy / len;
  const ny = dx / len;
  const control = {
    x: (a.x + b.x) / 2 + nx * len * bow * side,
    y: (a.y + b.y) / 2 + ny * len * bow * side,
  };
  const u = 1 - t;
  const mid = {
    x: u * u * a.x + 2 * u * t * control.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * control.y + t * t * b.y,
  };
  // B'(t) = 2(1-t)(C-P0) + 2t(P1-C); at t = 0.5 this is parallel to the chord.
  const tx = 2 * u * (control.x - a.x) + 2 * t * (b.x - control.x);
  const ty = 2 * u * (control.y - a.y) + 2 * t * (b.y - control.y);
  const angle = (Math.atan2(ty, tx) * 180) / Math.PI;
  // Rounded so server and browser float maths serialise identically (no hydration diffs).
  const r = (n: number) => Math.round(n * 10) / 10;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    d: `M${r(a.x)} ${r(a.y)}Q${r(control.x)} ${r(control.y)} ${r(b.x)} ${r(b.y)}`,
    control: { x: r2(control.x), y: r2(control.y) },
    mid: { x: r2(mid.x), y: r2(mid.y) },
    angle: r2(angle),
  };
}

/** Smallest distance from a few sample points of the arc to any of `others`. */
function clearance(a: Pt, b: Pt, arc: Arc, others: Pt[]): number {
  const { control: c } = arc;
  let min = Infinity;
  for (const t of [0.25, 0.5, 0.75]) {
    const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x;
    const y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y;
    for (const o of others) min = Math.min(min, Math.hypot(x - o.x, y - o.y));
  }
  return min;
}

/**
 * Arcs joining consecutive points. Sides alternate by default so neighbouring
 * arcs bow apart; where one side would pass noticeably closer to another pin,
 * the arc takes the roomier side instead.
 */
export function buildRoute(points: Pt[]): Arc[] {
  const arcs: Arc[] = [];
  let prev: 1 | -1 = -1;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const others = points.filter((_, j) => j !== i && j !== i + 1);
    const preferred: 1 | -1 = prev === 1 ? -1 : 1;
    // Stagger chevron positions so crossing arcs don't stack their arrowheads.
    const t = [0.5, 0.35, 0.5, 0.65][i % 4];
    const pa = buildArc(a, b, preferred, 0.22, t);
    const pb = buildArc(a, b, preferred === 1 ? -1 : 1, 0.22, t);
    const gap = clearance(a, b, pb, others) - clearance(a, b, pa, others);
    const useOther = others.length > 0 && gap > 8;
    prev = useOther ? (preferred === 1 ? -1 : 1) : preferred;
    arcs.push(useOther ? pb : pa);
  }
  return arcs;
}
