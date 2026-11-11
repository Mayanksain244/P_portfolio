// Renders src/app/apple-icon.png (180x180) from src/app/icon.svg with sharp.
// Usage: node scripts/make-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile(new URL("../src/app/icon.svg", import.meta.url));
// iOS applies its own rounding: render full-bleed navy with the glyph inset, 180x180.
const png = await sharp(svg, { density: 384 }).resize(180, 180).png().toBuffer();
await writeFile(new URL("../src/app/apple-icon.png", import.meta.url), png);
console.log("wrote src/app/apple-icon.png", png.length, "bytes");
