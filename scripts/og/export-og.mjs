// Exports the share banners as small JPEGs (WhatsApp drops previews > ~300 KB).
// Needs the dev server:  npm run dev   then   node scripts/og/export-og.mjs
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const base = process.env.OG_BASE_URL || "http://localhost:3000";
const out = path.resolve(import.meta.dirname, "../../public/images/og");
mkdirSync(out, { recursive: true });
for (const locale of ["en", "hi"]) {
  const res = await fetch(`${base}/api/og/${locale}`);
  if (!res.ok) throw new Error(`${locale}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const info = await sharp(buf).flatten({ background: "#0F2A44" })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(out, `og-${locale}.jpg`));
  console.log(locale, info.width, info.height, info.size);
}
