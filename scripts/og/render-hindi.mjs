// Satori (next/og) cannot shape Devanagari (wrong matra order), so the Hindi
// text lines of the OG banner are pre-rendered by a real browser engine
// (headless Edge/Chrome) into transparent PNGs at 2x. Re-run after changing
// the profile text or the wording:  node scripts/og/render-hindi.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { profile } from "../../src/content/profile.ts";

const root = path.resolve(import.meta.dirname, "../..");
const fontDir = path.join(root, "src/app/fonts/og");
const outDir = path.join(root, "public/images/og");
mkdirSync(outDir, { recursive: true });

const browsers = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];
const browser = browsers.find((b) => existsSync(b));
if (!browser) throw new Error("No Edge/Chrome found");

const lines = {
  "hi-name": { text: profile.name.hi, size: 66, weight: 700, color: "#F4EFE6" },
  "hi-designation": {
    text: profile.designation.hi.split(",")[0].trim(),
    size: 34,
    weight: 400,
    color: "rgba(244,239,230,0.88)",
  },
  "hi-org": {
    text: `लोक निर्माण विभाग उत्तराखंड · ${profile.serviceStartYear} से`,
    size: 28,
    weight: 400,
    color: "#E0A526",
  },
};

const font = (f) => pathToFileURL(path.join(fontDir, f)).href;
const tmp = mkdtempSync(path.join(tmpdir(), "og-"));
for (const [name, l] of Object.entries(lines)) {
  const html = `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:D;font-weight:700;src:url(${font("noto-devanagari-bold.ttf")})}
@font-face{font-family:D;font-weight:400;src:url(${font("noto-devanagari-regular.ttf")})}
html,body{margin:0;background:transparent}
div{font:${l.weight} ${l.size}px/1.6 D;color:${l.color};white-space:nowrap;display:inline-block;padding:20px}
</style><div>${l.text}</div>`;
  const file = path.join(tmp, `${name}.html`);
  const shot = path.join(tmp, `${name}.png`);
  writeFileSync(file, html);
  execFileSync(browser, [
    "--headless", "--disable-gpu", `--user-data-dir=${path.join(tmp, "profile")}`, "--hide-scrollbars",
    "--default-background-color=00000000", "--force-device-scale-factor=2",
    "--window-size=1100,200", `--screenshot=${shot}`, pathToFileURL(file).href,
  ], { stdio: "inherit", timeout: 60000 });
  for (let i = 0; i < 40 && !existsSync(shot); i++) await new Promise((r) => setTimeout(r, 250));
  await new Promise((r) => setTimeout(r, 300));
  const out = await sharp(shot).trim({ threshold: 1 }).extend({ top: 8, bottom: 8, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ palette: true }).toFile(path.join(outDir, `${name}.png`));
  console.log(name, out.width, out.height, out.size);
}
