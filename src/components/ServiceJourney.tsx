"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { INDIA_INSET, POSTING_POINTS, UK_MAP } from "@/content/map-paths";
import { profile, type Posting } from "@/content/profile";
import { pick } from "@/lib/content";
import { buildRoute } from "@/lib/journey";
import { districtCount } from "@/lib/stats";
import ContourBackground from "./ContourBackground";

const ARC_MS = 600;
const PAD_X = 62;
const PAD_Y = 52;

/** Which side of its pin each label sits on (default: right). */
const LABEL_SIDE: Record<string, "left" | "right" | "top"> = {
  "narendra-nagar": "left",
  ghansali: "top",
};

type Phase = "static" | "hidden" | "drawn";

function yearsLabel(p: Posting, presentWord: string): string {
  return `${p.from}–${p.to ?? presentWord}`;
}

export default function ServiceJourney({ years }: { years: number }) {
  const t = useTranslations("journey");
  const locale = useLocale();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const postings = profile.postings;

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const active = hovered ?? selected;

  // View window: the postings' bounding box plus padding, clamped to the map.
  const vb = useMemo(() => {
    const pts = postings.map((p) => POSTING_POINTS[p.id]);
    const x0 = Math.max(0, Math.min(...pts.map((p) => p.x)) - PAD_X);
    const x1 = Math.min(UK_MAP.width, Math.max(...pts.map((p) => p.x)) + PAD_X);
    const y0 = Math.max(0, Math.min(...pts.map((p) => p.y)) - PAD_Y);
    const y1 = Math.min(UK_MAP.height, Math.max(...pts.map((p) => p.y)) + PAD_Y);
    const r = (n: number) => Math.round(n * 10) / 10;
    return { x: r(x0), y: r(y0), w: r(x1 - x0), h: r(y1 - y0) };
  }, [postings]);

  const arcs = useMemo(
    () => buildRoute(postings.map((p) => POSTING_POINTS[p.id])),
    [postings],
  );

  // Draw-in animation: server HTML and no-JS show everything; with JS and
  // motion allowed the arcs hide, then draw in sequence when scrolled into view.
  const [phase, setPhase] = useState<Phase>("static");
  const mapRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = mapRef.current;
    if (
      !el ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    )
      return;
    setPhase("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase("drawn");
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const present = t("present");
  const routeNames = postings.map((p) => pick(p.place, locale)).join(" → ");
  const current = postings.find((p) => p.to === null);
  const isCurrent = (p: Posting) => p.id === current?.id;
  const toggleSelected = (id: string) =>
    setSelected((s) => (s === id ? null : id));

  const arcOpacity = (i: number) =>
    active === null ? 1 : postings[i + 1].id === active ? 1 : 0.22;

  return (
    <div className="grid items-start gap-8 md:grid-cols-[3fr_2fr] md:gap-10">
      {/* ---------- Map ---------- */}
      <figure ref={mapRef} className="journey-map m-0 min-w-0">
        <div className="relative overflow-hidden border-2 border-navy bg-[var(--map-bg)] text-[var(--map-ink)] dark:border-paper">
          <div aria-hidden="true" className="bg-blueprint absolute inset-0 opacity-60" />
          <ContourBackground className="text-[var(--map-ink)] opacity-[0.08]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-1.5 z-10 border border-[var(--map-ink)] opacity-40"
          />

          <svg
            role="img"
            aria-label={t("mapLabel", { route: routeNames })}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            className="relative block h-auto w-full"
          >
            <defs>
              {arcs.map((a, i) => (
                <mask
                  key={i}
                  id={`${uid}-m${i}`}
                  maskUnits="userSpaceOnUse"
                  x={0}
                  y={0}
                  width={UK_MAP.width}
                  height={UK_MAP.height}
                >
                  <path
                    d={a.d}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={8}
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={phase === "hidden" ? 1 : 0}
                    className="route-arc"
                    style={{ transitionDelay: `${i * ARC_MS}ms` }}
                  />
                </mask>
              ))}
            </defs>

            <path
              d={UK_MAP.state}
              fill="var(--map-state)"
              fillRule="evenodd"
              stroke="var(--map-ink)"
              strokeWidth={1.3}
              strokeLinejoin="round"
            />
            <path
              d={UK_MAP.districts}
              fill="none"
              stroke="var(--map-faint)"
              strokeWidth={0.6}
              strokeLinejoin="round"
            />

            {/* Route arcs */}
            {arcs.map((a, i) => {
              const lit = active !== null && postings[i + 1].id === active;
              return (
                <g
                  key={i}
                  style={{ opacity: arcOpacity(i), transition: "opacity 0.2s" }}
                >
                  <path
                    d={a.d}
                    fill="none"
                    stroke="var(--map-route)"
                    strokeWidth={lit ? 2.6 : 1.8}
                    strokeDasharray="5 3.5"
                    strokeLinecap="round"
                    mask={`url(#${uid}-m${i})`}
                  />
                  <path
                    d="M-3.4 -3.2L1.8 0L-3.4 3.2"
                    fill="none"
                    stroke="var(--map-route)"
                    strokeWidth={lit ? 2.4 : 1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform={`translate(${a.mid.x} ${a.mid.y}) rotate(${a.angle})`}
                    style={{
                      opacity: phase === "hidden" ? 0 : 1,
                      transition: "opacity 0.3s",
                      transitionDelay:
                        phase === "drawn" ? `${(i + 1) * ARC_MS - 150}ms` : "0ms",
                    }}
                  />
                </g>
              );
            })}

            {/* Pins */}
            {postings.map((p) => {
              const { x, y } = POSTING_POINTS[p.id];
              const cur = isCurrent(p);
              const on = active === p.id;
              return (
                <g
                  key={p.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => toggleSelected(p.id)}
                >
                  {cur && (
                    <circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill="var(--map-current)"
                      className="pulse-ring"
                    />
                  )}
                  {/* generous invisible hit target */}
                  <circle cx={x} cy={y} r={11} fill="transparent" />
                  <circle
                    cx={x}
                    cy={y}
                    r={on ? 8.6 : 7.4}
                    fill="var(--map-ring)"
                    stroke={on ? "var(--map-route)" : "none"}
                    strokeWidth={1.6}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={on ? 5.6 : 4.6}
                    fill={cur ? "var(--map-current)" : "var(--map-pin)"}
                    stroke={cur ? "var(--map-pin)" : "none"}
                    strokeWidth={1.4}
                  />
                </g>
              );
            })}
          </svg>

          {/* Pin labels (HTML so they stay a readable size at any map scale) */}
          <ul aria-hidden="true" className="pointer-events-none absolute inset-0 m-0 list-none p-0">
            {postings.map((p) => {
              const { x, y } = POSTING_POINTS[p.id];
              const side = LABEL_SIDE[p.id] ?? "right";
              const style: CSSProperties = {
                left: `${(((x - vb.x) / vb.w) * 100).toFixed(2)}%`,
                top: `${(((y - vb.y) / vb.h) * 100).toFixed(2)}%`,
              };
              const place =
                side === "left"
                  ? "-translate-x-full -translate-y-1/2 -ml-3.5 sm:-ml-4"
                  : side === "top"
                    ? "-translate-x-1/2 -translate-y-full -mt-3"
                    : "-translate-y-1/2 ml-3.5 sm:ml-4";
              return (
                <li
                  key={p.id}
                  style={style}
                  className={`absolute z-20 whitespace-nowrap rounded-sm px-1 text-[11px] font-semibold leading-tight text-[var(--map-ink)] [text-shadow:0_0_3px_var(--map-bg),0_0_3px_var(--map-bg),0_0_5px_var(--map-bg)] sm:text-[13px] ${place} ${
                    active === p.id ? "bg-[var(--map-bg)] ring-1 ring-[var(--map-ink)]" : ""
                  }`}
                >
                  {pick(p.place, locale)}
                </li>
              );
            })}
          </ul>

          {/* India locator inset */}
          <svg
            role="img"
            aria-label={t("locatorLabel")}
            viewBox={`0 0 ${INDIA_INSET.width} ${INDIA_INSET.height}`}
            className="absolute right-3 top-3 z-20 w-[19%] min-w-[64px] max-w-[116px] border border-[var(--map-ink)] bg-[var(--map-bg)] p-0.5 sm:right-4 sm:top-4"
          >
            <path
              d={INDIA_INSET.india}
              fill="var(--map-state)"
              fillRule="evenodd"
              stroke="var(--map-ink)"
              strokeWidth={0.9}
              strokeLinejoin="round"
            />
            <path
              d={INDIA_INSET.uttarakhand}
              fill="var(--map-current)"
              fillRule="evenodd"
              stroke="var(--map-ink)"
              strokeWidth={0.8}
            />
          </svg>

          {/* North arrow */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 34"
            className="absolute bottom-4 left-4 z-20 w-5 text-[var(--map-ink)] sm:w-6"
          >
            <path d="M12 1L19 22L12 17L5 22Z" fill="currentColor" />
            <text
              x="12"
              y="32"
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="currentColor"
              fontFamily="inherit"
            >
              {t("northArrow")}
            </text>
          </svg>
        </div>
        <figcaption className="mt-2 text-xs text-muted">{t("mapAttribution")}</figcaption>
      </figure>

      {/* ---------- Timeline ---------- */}
      <div className="min-w-0">
        <p className="mb-4 text-sm text-muted">{t("selectHint")}</p>
        <ol
          aria-label={t("timelineLabel")}
          className="relative m-0 list-none p-0"
        >
          {/* hill road: navy carriageway with a dashed paper centre line */}
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-[11px] top-3 w-[14px] border-x border-navy/60 bg-navy dark:border-paper/50 dark:bg-navy-900"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-[17px] top-3 w-[2px] bg-[repeating-linear-gradient(to_bottom,var(--color-paper)_0_7px,transparent_7px_14px)]"
          />
          {postings.map((p) => {
            const cur = isCurrent(p);
            const on = active === p.id;
            return (
              <li key={p.id} className="relative pl-12">
                <span
                  aria-hidden="true"
                  className={`absolute left-[3px] top-7 h-[30px] w-[30px] rounded-full border-[3px] ${
                    cur
                      ? "border-navy bg-marigold dark:border-paper"
                      : "border-paper bg-navy dark:border-paper dark:bg-navy-900"
                  } ${on ? "scale-110" : ""} transition-transform`}
                />
                <button
                  type="button"
                  aria-pressed={selected === p.id}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(p.id)}
                  onBlur={() => setHovered(null)}
                  onClick={() => toggleSelected(p.id)}
                  data-active={on}
                  className="my-1 block w-full border-l-4 border-transparent px-4 py-3 text-start transition-colors hover:bg-background data-[active=true]:border-marigold data-[active=true]:bg-background"
                >
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-heading text-2xl font-semibold leading-tight sm:text-3xl">
                      {yearsLabel(p, present)}
                    </span>
                    {cur && (
                      <span className="rounded-sm bg-marigold px-2 py-0.5 text-xs font-bold text-navy">
                        {t("currentPosting")}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-lg font-medium">
                    {pick(p.place, locale)}
                  </span>
                  <span className="block text-sm text-muted">
                    {pick(p.district, locale)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <p className="mt-6 border-t-2 border-navy pt-4 font-heading text-lg font-semibold dark:border-paper">
          {t("total", {
            postings: postings.length,
            districts: districtCount(postings),
            years,
          })}
        </p>
      </div>
    </div>
  );
}
