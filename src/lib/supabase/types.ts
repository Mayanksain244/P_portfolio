export const ALBUM_CATEGORIES = [
  "roads",
  "bridges",
  "buildings",
  "disaster_relief",
  "inspections",
  "events",
  "awards",
  "other",
] as const;

export type AlbumCategory = (typeof ALBUM_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<AlbumCategory, { en: string; hi: string }> = {
  roads: { en: "Roads", hi: "सड़कें" },
  bridges: { en: "Bridges", hi: "पुल" },
  buildings: { en: "Buildings", hi: "भवन" },
  disaster_relief: { en: "Disaster Relief", hi: "आपदा राहत" },
  inspections: { en: "Inspections", hi: "निरीक्षण" },
  events: { en: "Events", hi: "कार्यक्रम" },
  awards: { en: "Awards & Honours", hi: "पुरस्कार एवं सम्मान" },
  other: { en: "Other", hi: "अन्य" },
};

export type Album = {
  id: string;
  slug: string;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  category: AlbumCategory;
  event_date: string | null; // YYYY-MM-DD
  location_en: string | null;
  location_hi: string | null;
  cover_image_id: string | null;
  sort_order: number | null;
  published: boolean | null;
  created_at: string;
  updated_at: string;
};

export type ImageRow = {
  id: string;
  album_id: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  blur_data_url: string | null;
  caption_en: string | null;
  caption_hi: string | null;
  tags: string[] | null;
  taken_on: string | null;
  sort_order: number | null;
  created_at: string;
};

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  body: string;
  ip_hash: string | null;
  created_at: string;
  read: boolean;
};

/** Album as shown in listings: with resolved cover and photo count. */
export type AlbumSummary = Album & {
  cover_url: string | null;
  cover_blur: string | null;
  photo_count: number;
};

/** An image with its public URL resolved. */
export type GalleryImage = ImageRow & { url: string };

export type AlbumWithImages = {
  album: Album;
  images: GalleryImage[];
  cover_url: string | null;
};
