import { z } from "zod";
import { ALBUM_CATEGORIES } from "@/lib/supabase/types";

export const SLUG_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Trims; empty string becomes null. */
const optText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => {
      const t = v?.trim();
      return t ? t : null;
    });

const optDate = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim() : null))
  .refine((v) => v === null || (DATE_RE.test(v) && !Number.isNaN(Date.parse(v))), {
    message: "Use a valid date.",
  });

export const albumSchema = z.object({
  title_en: z.string().trim().min(1, "English title is required.").max(200),
  title_hi: optText(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(80)
    .regex(SLUG_RE, "Use only lowercase letters, numbers and hyphens."),
  category: z.enum(ALBUM_CATEGORIES),
  event_date: optDate,
  location_en: optText(200),
  location_hi: optText(200),
  description_en: optText(5000),
  description_hi: optText(5000),
  published: z.boolean(),
});
export type AlbumInput = z.input<typeof albumSchema>;
export type AlbumData = z.output<typeof albumSchema>;

export const idSchema = z.string().uuid();

export const tagsSchema = z
  .array(z.string())
  .max(30)
  .transform((tags) => [
    ...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
  ])
  .refine((tags) => tags.every((t) => t.length <= 40), {
    message: "Tags must be 40 characters or fewer.",
  });

export const imageUpdateSchema = z
  .object({
    id: idSchema,
    caption_en: optText(500).optional(),
    caption_hi: optText(500).optional(),
    tags: tagsSchema.optional(),
    taken_on: optDate.optional(),
  })
  .strict();
export type ImageUpdateInput = z.input<typeof imageUpdateSchema>;

export const UPLOAD_EXTS = ["webp", "jpg", "jpeg", "png", "avif"] as const;
export const CONTENT_TYPES: Record<(typeof UPLOAD_EXTS)[number], string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
};

export const addImageSchema = z.object({
  albumId: idSchema,
  path: z
    .string()
    .regex(/^albums\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|jpeg|png|avif)$/),
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  blur: z.string().max(4000).startsWith("data:image/").nullish(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username.").max(100),
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().max(500).nullish(),
});
