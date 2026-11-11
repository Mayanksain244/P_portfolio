import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";
import { pick } from "@/lib/content";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
const size = { width: 1200, height: 630 };
export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const NAVY = "#0F2A44";
const PAPER = "#F4EFE6";
const MARIGOLD = "#E0A526";

const line = (s: string) => s.split(",")[0].trim();

const orgLine = () => `PWD Uttarakhand · Since ${profile.serviceStartYear}`;

/** Satori cannot shape Devanagari, so Hindi lines are PNGs from scripts/og/render-hindi.mjs. */
async function hindiLine(name: string) {
  const buf = await asset("public", "images", "og", `${name}.png`);
  return {
    src: `data:image/png;base64,${buf.toString("base64")}`,
    // PNG header: width/height at bytes 16-23; files are rendered at 2x.
    w: buf.readUInt32BE(16) / 2,
    h: buf.readUInt32BE(20) / 2,
  };
}

async function asset(...parts: string[]) {
  return readFile(path.join(process.cwd(), ...parts));
}

/** Source for the committed JPEGs: run scripts/og/export-og.mjs against the dev server. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  const locale = raw === "hi" ? "hi" : "en";
  const hi = locale === "hi";

  const [frB, frR, portrait] = await Promise.all([
    asset("src", "app", "fonts", "og", "fraunces-bold.ttf"),
    asset("src", "app", "fonts", "og", "fraunces-regular.ttf"),
    asset("public", "images", "portrait", "portrait-og.png"),
  ]);
  const portraitSrc = `data:image/png;base64,${portrait.toString("base64")}`;
  const hiLines = hi
    ? await Promise.all(["hi-name", "hi-designation", "hi-org"].map(hindiLine))
    : null;

  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= 1200; x += 40)
    gridLines.push(
      <div key={`v${x}`} style={{ position: "absolute", left: x, top: 0, width: 1, height: 630, background: "rgba(244,239,230,0.06)" }} />,
    );
  for (let y = 0; y <= 630; y += 40)
    gridLines.push(
      <div key={`h${y}`} style={{ position: "absolute", top: y, left: 0, height: 1, width: 1200, background: "rgba(244,239,230,0.06)" }} />,
    );

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative", background: NAVY, color: PAPER, overflow: "hidden" }}>
        {gridLines}
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <g fill="none" stroke="rgba(244,239,230,0.09)" strokeWidth="1.5">
            <path d="M-20 520 C 160 450, 300 570, 480 500 S 760 380, 900 430 S 1120 350, 1240 390" />
            <path d="M-20 565 C 170 500, 310 615, 490 545 S 770 430, 910 480 S 1130 400, 1240 440" />
            <path d="M-20 610 C 180 550, 320 655, 500 590 S 780 480, 920 530 S 1140 450, 1240 490" />
          </g>
          <circle cx="905" cy="330" r="262" fill="none" stroke={MARIGOLD} strokeWidth="3" strokeDasharray="1100 600" strokeLinecap="round" transform="rotate(-200 905 330)" />
        </svg>
        <div style={{ position: "absolute", left: 645, top: 70, width: 520, height: 560, display: "flex", background: "radial-gradient(circle at 50% 55%, rgba(244,239,230,0.34) 0%, rgba(244,239,230,0.12) 45%, rgba(244,239,230,0) 70%)" }} />
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={portraitSrc} width={517} height={600} style={{ position: "absolute", right: 70, bottom: 0, width: 517, height: 600 }} />

        <div style={{ position: "absolute", left: 72, top: 0, bottom: 0, width: 640, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {hiLines ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img src={hiLines[0].src} width={hiLines[0].w} height={hiLines[0].h} style={{ width: hiLines[0].w, height: hiLines[0].h }} />
          ) : (
            <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 70, fontWeight: 700, lineHeight: 1.18, color: PAPER }}>
              {pick(profile.name, locale)}
            </div>
          )}
          {hiLines ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img src={hiLines[1].src} width={hiLines[1].w} height={hiLines[1].h} style={{ marginTop: 14, width: hiLines[1].w, height: hiLines[1].h }} />
          ) : (
            <div style={{ display: "flex", marginTop: 22, fontFamily: "Fraunces", fontSize: 32, fontWeight: 400, lineHeight: 1.3, color: "rgba(244,239,230,0.88)" }}>
              {line(pick(profile.designation, locale))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", marginTop: 34, width: 400 }}>
            <div style={{ width: 2, height: 18, background: MARIGOLD }} />
            <div style={{ flex: 1, height: 2, background: MARIGOLD }} />
            <div style={{ width: 2, height: 18, background: MARIGOLD }} />
          </div>
          {hiLines ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img src={hiLines[2].src} width={hiLines[2].w} height={hiLines[2].h} style={{ marginTop: 18, width: hiLines[2].w, height: hiLines[2].h }} />
          ) : (
            <div style={{ display: "flex", marginTop: 26, fontFamily: "Fraunces", fontSize: 28, fontWeight: 400, color: MARIGOLD }}>
              {orgLine()}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: frB, weight: 700, style: "normal" },
        { name: "Fraunces", data: frR, weight: 400, style: "normal" },
      ],
    },
  );
}
