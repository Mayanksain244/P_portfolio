"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { localized } from "@/lib/diary";
import type { GalleryImage } from "@/lib/supabase/types";
import Lightbox, { imageDims } from "./Lightbox";

/** Masonry (CSS columns) of an album's photos, opening a lightbox synced to `?photo=<index>`. */
export default function AlbumGallery({
  images,
  albumTitle,
}: {
  images: GalleryImage[];
  albumTitle: string;
}) {
  const t = useTranslations("gallery");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const wasOpen = useRef(false);

  const setUrl = useCallback(
    (index: number | null) => {
      router.replace(index === null ? pathname : `${pathname}?photo=${index}`, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  // Deep link: open the photo named in the URL once, after hydration.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("photo");
    const n = p === null ? NaN : Number(p);
    if (Number.isInteger(n) && n >= 0 && n < images.length) setOpen(n);
  }, [images.length]);

  // Return focus when the lightbox closes.
  useEffect(() => {
    if (open !== null) {
      wasOpen.current = true;
      return;
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      const target = opener.current?.isConnected ? opener.current : null;
      target?.focus();
    }
  }, [open]);

  function openAt(i: number, el: HTMLElement) {
    opener.current = el;
    setOpen(i);
    setUrl(i);
  }

  if (images.length === 0) {
    return <p className="text-muted">{t("albumEmpty")}</p>;
  }

  return (
    <>
      <ul className="columns-1 gap-4 p-0 md:columns-2 lg:columns-3">
        {images.map((img, i) => {
          const { width, height } = imageDims(img);
          const caption = localized(img.caption_en, img.caption_hi, locale);
          return (
            <li key={img.id} className="mb-4 list-none break-inside-avoid">
              <figure className="border-2 border-navy bg-background dark:border-paper">
                <button
                  ref={(el) => {
                    thumbs.current[i] = el;
                  }}
                  type="button"
                  onClick={(e) => openAt(i, e.currentTarget)}
                  aria-label={t("openPhoto", { n: i + 1, total: images.length })}
                  className="block w-full cursor-zoom-in"
                >
                  <Image
                    src={img.url}
                    alt={caption}
                    width={width}
                    height={height}
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    loading="lazy"
                    className="h-auto w-full"
                    {...(img.blur_data_url
                      ? { placeholder: "blur" as const, blurDataURL: img.blur_data_url }
                      : {})}
                  />
                </button>
                {caption && (
                  <figcaption className="border-t border-navy/40 px-3 py-2 text-sm text-muted dark:border-paper/40">
                    {caption}
                  </figcaption>
                )}
              </figure>
            </li>
          );
        })}
      </ul>

      {open !== null && (
        <Lightbox
          images={images}
          index={open}
          albumTitle={albumTitle}
          onIndexChange={(n) => {
            setOpen(n);
            setUrl(n);
            // If opened by deep link, keep a sensible return target.
            opener.current ??= thumbs.current[n];
          }}
          onClose={() => {
            if (!opener.current?.isConnected) opener.current = thumbs.current[open];
            setOpen(null);
            setUrl(null);
          }}
        />
      )}
    </>
  );
}
