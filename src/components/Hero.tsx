import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { profile } from "@/content/profile";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/content";
import BlueprintGrid from "./BlueprintGrid";
import ContourBackground from "./ContourBackground";

// Geometry in the portrait's own pixel space (1034 x 1200) so the arc stays
// registered to the head at every size.
const CX = 440;
const CY = 390;
const R = 440;
const HALF = (100 * Math.PI) / 180; // 200 degrees total, opening downwards
const pt = (a: number, r = R) =>
  [CX + r * Math.sin(a), CY - r * Math.cos(a)] as const;
const [lx, ly] = pt(-HALF);
const [rx, ry] = pt(HALF);
const ARC = `M${lx.toFixed(1)} ${ly.toFixed(1)} A${R} ${R} 0 1 1 ${rx.toFixed(1)} ${ry.toFixed(1)}`;
const INNER = `M${pt(-HALF, R - 26)[0].toFixed(1)} ${pt(-HALF, R - 26)[1].toFixed(1)} A${R - 26} ${R - 26} 0 1 1 ${pt(HALF, R - 26)[0].toFixed(1)} ${pt(HALF, R - 26)[1].toFixed(1)}`;
const tick = (a: number) => {
  const [x1, y1] = pt(a, R - 22);
  const [x2, y2] = pt(a, R + 22);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

/** Faint Garhwal ridge line across the bottom of the hero. */
const RIDGE =
  "0,170 90,150 170,160 260,110 330,135 420,70 500,120 570,95 660,150 760,100 850,40 930,105 1010,80 1100,130 1190,90 1280,140 1360,115 1440,150";

export default async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const portrait = profile.portrait;

  return (
    <BlueprintGrid className="relative overflow-hidden bg-navy text-paper dark:bg-navy-900">
      <ContourBackground className="text-paper" />
      {/* Ridge silhouette, behind everything */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-paper opacity-[0.08] sm:h-40"
      >
        <polygon points={`${RIDGE} 1440,200 0,200`} fill="currentColor" />
        <polyline
          points={RIDGE}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 md:grid md:min-h-[max(34rem,calc(88svh-4rem))] md:grid-cols-[55fr_45fr] md:gap-6">
        {/* Portrait: above the text on mobile, right column from md up */}
        {portrait && (
          <div className="hero-col relative order-first pt-10 md:order-none md:col-start-2 md:row-start-1 md:pt-0">
            <div className="hero-figure">
              <div className="hero-glow" aria-hidden="true" />
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox={`0 0 ${portrait.width} ${portrait.height}`}
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-marigold"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
              >
                <path d={INNER} strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.35" strokeDasharray="3 8" />
                <path
                  d={ARC}
                  pathLength={1}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  className="hero-arc"
                />
                <g className="hero-arc-ticks">
                  <path d={tick(-HALF)} vectorEffect="non-scaling-stroke" strokeWidth="2" />
                  <path d={tick(HALF)} vectorEffect="non-scaling-stroke" strokeWidth="2" />
                </g>
              </svg>
              <Image
                src={portrait.src}
                alt={pick(portrait.alt, locale)}
                width={portrait.width}
                height={portrait.height}
                priority
                sizes="(min-width: 1280px) 520px, (min-width: 768px) 45vw, 280px"
                className="hero-portrait-img"
              />
            </div>
            {/* Mobile baseline rule the figure stands on */}
            <div
              aria-hidden="true"
              className="h-0.5 w-full bg-marigold md:hidden"
            />
          </div>
        )}

        <div className="relative z-10 py-8 md:col-start-1 md:row-start-1 md:flex md:flex-col md:justify-center md:py-16">
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] sm:text-6xl lg:text-6xl xl:text-7xl">
            {pick(profile.name, locale)}
          </h1>
          <p className="mt-4 text-lg font-medium text-marigold sm:mt-5 sm:text-xl">
            {pick(profile.designation, locale)}
          </p>
          <p className="mt-4 max-w-xl text-base text-paper/90 sm:mt-6 sm:text-xl">
            {t("home.tagline")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
            <Link href="/works" className="btn btn-primary">
              {t("home.viewWorks")}
            </Link>
            <Link href="/contact" className="btn btn-outline">
              {t("home.getInTouch")}
            </Link>
          </div>
        </div>
      </div>
    </BlueprintGrid>
  );
}
