// Portrait cutout pipeline. Run: node process.mjs  (from scripts/portrait, after npm install)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const { default: sharp } = await import('sharp');

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../public/images/portrait');
const src = path.join(out, 'original.png');
const ERODE = Number(process.env.ERODE ?? 1);
const FEATHER = Number(process.env.FEATHER ?? 0.8);
const MODEL = process.env.MODEL ?? 'medium';

const W = 1254, H = 1254;
const orig = await sharp(src).removeAlpha().raw().toBuffer(); // RGB

// 1. model matte
const mattePath = path.join(here, '.matte.png');
if (!fs.existsSync(mattePath) || process.env.REMATTE !== '0') {
  const r = spawnSync(process.execPath, [path.join(here, 'matte.mjs'), src, mattePath, MODEL], { stdio: 'inherit' });
  if (!fs.existsSync(mattePath)) throw new Error('matting failed, status ' + r.status);
}
const matte = await sharp(mattePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (matte.info.width !== W || matte.info.height !== H) throw new Error('size mismatch');
let a = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) a[i] = matte.data[i * 4 + 3];

// 2. keep only the largest connected component (alpha>16), drop specks; fill tiny holes
{
  const lab = new Int32Array(W * H); let best = 0, bestN = 0, id = 0;
  const stack = new Int32Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (a[s] <= 16 || lab[s]) continue;
    id++; let sp = 0, n = 0; stack[sp++] = s; lab[s] = id;
    while (sp) {
      const p = stack[--sp]; n++;
      const x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (a[q] > 16 && !lab[q]) { lab[q] = id; stack[sp++] = q; }
      }
    }
    if (n > bestN) { bestN = n; best = id; }
  }
  for (let i = 0; i < W * H; i++) if (lab[i] !== best) a[i] = 0;
}

// 3. erode ~1px (min filter), then light feather (blur)
function minFilter(src, r) {
  const o = new Uint8Array(src.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 255;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx, ny = y + dy;
      const v = (nx < 0 || ny < 0 || nx >= W || ny >= H) ? src[y * W + x] : src[ny * W + nx]; // frame edge: don't erode
      if (v < m) m = v;
    }
    o[y * W + x] = m;
  }
  return o;
}
// tighten the matte: drops faint translucent haze (flyaway-hair ghosting), keeps a soft ramp
const LO = Number(process.env.LO ?? 60), HI = Number(process.env.HI ?? 225);
for (let i = 0; i < a.length; i++) { const t = Math.min(1, Math.max(0, (a[i] - LO) / (HI - LO))); a[i] = Math.round(255 * t * t * (3 - 2 * t)); }
if (ERODE > 0) a = minFilter(a, ERODE);
if (FEATHER > 0) {
  const b = await sharp(Buffer.from(a), { raw: { width: W, height: H, channels: 1 } }).blur(FEATHER).toColourspace('b-w').raw().toBuffer({ resolveWithObject: true });
  if (b.info.channels !== 1) throw new Error('blur channels ' + b.info.channels);
  a = new Uint8Array(b.data);
}

// 4. decontaminate against white: F = (C - (1-a)*255)/a
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const al = a[i] / 255;
  for (let c = 0; c < 3; c++) {
    let v = orig[i * 3 + c];
    if (al > 0 && al < 1) v = (v - (1 - al) * 255) / Math.max(al, 0.25);
    rgba[i * 4 + c] = Math.max(0, Math.min(255, Math.round(v)));
  }
  rgba[i * 4 + 3] = a[i];
}
// For semi-transparent pixels, pull colour from nearby opaque interior to kill residual fringe
{
  const A = Buffer.from(a);
  const solid = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).toBuffer();
  void solid; void A;
}

// 5. trim bbox + 2% padding (alpha>8); bottom flush with frame stays flat
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (a[y * W + x] > 8) {
  if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
}
const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);
const bx0 = Math.max(0, x0 - pad), by0 = Math.max(0, y0 - pad);
const bx1 = Math.min(W - 1, x1 + pad), by1 = Math.min(H - 1, y1 + pad);
const full = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: bx0, top: by0, width: bx1 - bx0 + 1, height: by1 - by0 + 1 }).png({ compressionLevel: 9 }).toBuffer();
fs.writeFileSync(path.join(out, 'portrait-cutout.png'), full);

// 6. outputs
const meta = {};
const info = async (name) => { const m = await sharp(path.join(out, name)).metadata(); const s = fs.statSync(path.join(out, name)).size; meta[name] = { width: m.width, height: m.height, bytes: s }; };
await sharp(full).resize({ height: 1200, withoutEnlargement: true }).webp({ quality: 85, alphaQuality: 90 }).toFile(path.join(out, 'portrait-cutout.webp'));
await sharp(full).resize({ height: 600, withoutEnlargement: true }).webp({ quality: 85, alphaQuality: 90 }).toFile(path.join(out, 'portrait-cutout-sm.webp'));

// square 1200x1200 on navy, subject bottom-anchored
{
  const sub = await sharp(full).resize({ height: 1100, width: 1160, fit: 'inside' }).toBuffer({ resolveWithObject: true });
  const left = Math.round((1200 - sub.info.width) / 2);
  await sharp({ create: { width: 1200, height: 1200, channels: 3, background: '#0F2A44' } })
    .composite([{ input: sub.data, left, top: 1200 - sub.info.height }]).webp({ quality: 88 }).toFile(path.join(out, 'portrait-square.webp'));
}
for (const [name, bg] of [['preview-navy.png', '#0A1C2E'], ['preview-paper.png', '#F4EFE6']]) {
  await sharp({ create: { width: bx1 - bx0 + 1, height: by1 - by0 + 1, channels: 3, background: bg } })
    .composite([{ input: full }]).png().toFile(path.join(out, name));
}
for (const n of ['portrait-cutout.png','portrait-cutout.webp','portrait-cutout-sm.webp','portrait-square.webp','preview-navy.png','preview-paper.png']) await info(n);
meta.alphaBoundingBoxInOriginal = { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
meta.cropInOriginal = { x: bx0, y: by0, width: bx1 - bx0 + 1, height: by1 - by0 + 1 };
meta.source = { width: W, height: H };
meta.params = { MODEL, ERODE, FEATHER, LO, HI };
fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 2));
console.log(JSON.stringify(meta, null, 2));
