"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { localized } from "@/lib/diary";
import type { GalleryImage } from "@/lib/supabase/types";

const FOCUSABLE = "button, [href], [tabindex]:not([tabindex='-1'])";
const SWIPE_PX = 50;

export function imageDims(img: GalleryImage) {
  return { width: img.width ?? 1600, height: img.height ?? 1200 };
}

/**
 * Full-screen photo viewer. Controlled: the parent owns `index` (so it can sync the URL)
 * and unmounts the component to close it.
 */
export default function Lightbox({
  images,
  index,
  albumTitle,
  onClose,
  onIndexChange,
}: {
  images: GalleryImage[];
  index: number;
  albumTitle: string;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const t = useTranslations("lightbox");
  const locale = useLocale();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);

  const total = images.length;
  const prev = () => onIndexChange((index - 1 + total) % total);
  const next = () => onIndexChange((index + 1) % total);

  // Latest handlers for the stable document listener.
  const handlers = useRef({ prev, next, onClose });
  useEffect(() => {
    handlers.current = { prev, next, onClose };
  });

  // Body scroll lock and initial focus.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Keyboard: arrows, Escape, and a Tab focus trap.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handlers.current.onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handlers.current.next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlers.current.prev();
      } else if (e.key === "Tab") {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (!dialogRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const current = images[index];
  if (!current) return null;
  const caption = localized(current.caption_en, current.caption_hi, locale);
  const { width, height } = imageDims(current);
  const neighbours =
    total > 1
      ? [...new Set([(index + 1) % total, (index - 1 + total) % total])].filter(
          (i) => i !== index,
        )
      : [];

  const btn =
    "flex h-12 w-12 items-center justify-center border-2 border-paper/70 bg-navy-900/70 text-2xl text-paper hover:bg-navy-700";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("label")}
      className="fixed inset-0 z-50 flex flex-col bg-navy-900/95 text-paper"
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (start == null || end == null || total < 2) return;
        const dx = end - start;
        if (dx <= -SWIPE_PX) next();
        else if (dx >= SWIPE_PX) prev();
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <p aria-live="polite" className="diary-stamp text-sm">
          {t("counter", { current: index + 1, total })}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className={btn}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        {total > 1 && (
          <button
            type="button"
            onClick={prev}
            aria-label={t("previous")}
            className={`${btn} absolute start-2 top-1/2 z-10 -translate-y-1/2`}
          >
            <span aria-hidden="true" className="rtl:hidden">‹</span>
            <span aria-hidden="true" className="hidden rtl:inline">›</span>
          </button>
        )}
        {/* key restarts the fade for each photo */}
        <Image
          key={current.id}
          src={current.url}
          alt={caption || `${albumTitle} ${index + 1}`}
          width={width}
          height={height}
          sizes="100vw"
          priority
          className="lightbox-fade max-h-full w-auto max-w-full object-contain"
          {...(current.blur_data_url
            ? { placeholder: "blur" as const, blurDataURL: current.blur_data_url }
            : {})}
        />
        {total > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label={t("next")}
            className={`${btn} absolute end-2 top-1/2 z-10 -translate-y-1/2`}
          >
            <span aria-hidden="true" className="rtl:hidden">›</span>
            <span aria-hidden="true" className="hidden rtl:inline">‹</span>
          </button>
        )}
      </div>

      <div className="min-h-16 px-4 py-3 text-center">
        {caption && <p className="mx-auto max-w-3xl text-base">{caption}</p>}
      </div>

      {/* Preload the neighbouring photos at the same optimised size. */}
      <div aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
        {neighbours.map((i) => (
          <Image
            key={images[i].id}
            src={images[i].url}
            alt=""
            width={imageDims(images[i]).width}
            height={imageDims(images[i]).height}
            sizes="100vw"
            loading="eager"
          />
        ))}
      </div>
    </div>
  );
}
