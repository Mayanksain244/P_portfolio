// Client-side photo processing: honour EXIF rotation, resize to <= 2400px, encode WebP (JPEG fallback),
// and build a tiny blur placeholder.
export const MAX_EDGE = 2400;
export const UNSUPPORTED_MSG =
  "This photo format isn't supported by your browser — please export as JPEG.";

export type ProcessedImage = {
  blob: Blob;
  ext: "webp" | "jpg";
  contentType: string;
  width: number;
  height: number;
  blur: string;
};

export class UnsupportedImageError extends Error {
  constructor() {
    super(UNSUPPORTED_MSG);
  }
}

/** Scales (w,h) so the long edge is at most max; never upscales. */
export function fitWithin(w: number, h: number, max = MAX_EDGE) {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

function canvasToBlob(c: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((resolve) => c.toBlob((b) => resolve(b), type, q));
}

function draw(bitmap: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return c;
}

export async function processImage(file: File): Promise<ProcessedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new UnsupportedImageError();
  }
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = draw(bitmap, width, height);

    let blob = await canvasToBlob(canvas, "image/webp", 0.85);
    let ext: "webp" | "jpg" = "webp";
    if (!blob || blob.type !== "image/webp") {
      blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
      ext = "jpg";
    }
    if (!blob) throw new Error("Could not encode the photo.");

    const bw = 16;
    const bh = Math.max(1, Math.round((height / width) * bw));
    const small = draw(bitmap, bw, bh);
    let blur = small.toDataURL("image/webp", 0.5);
    if (!blur.startsWith("data:image/webp")) blur = small.toDataURL("image/jpeg", 0.5);

    return { blob, ext, contentType: blob.type, width, height, blur };
  } finally {
    bitmap.close();
  }
}
