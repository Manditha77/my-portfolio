"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { galleryCopy } from "@/content/case-studies";
import type { ContentImage } from "@/content/types";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/ui/icons";

type GalleryViewerProps = {
  images: readonly ContentImage[];
  /** The server-rendered gallery: each tile is an `a[data-shot]` linking to its image file. */
  children: ReactNode;
};

const control =
  "inline-flex size-11 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition-colors duration-fast ease-out hover:text-text light:shadow-card";

/**
 * A gallery's full view: a click on a tile opens that screenshot whole, as large as the screen allows
 * (never upscaled past its own size), in a modal <dialog>, with previous/next (buttons and ← →) and close
 * (button, Escape or a click outside the image). Focus returns to the tile on close. Without JS, or with a
 * modifier key, the tile is a plain link to the image file. Only the open image loads. No animation.
 */
export function GalleryViewer({ images, children }: GalleryViewerProps) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLAnchorElement | null>(null);
  const total = images.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (index !== null && dialog && !dialog.open) dialog.showModal();
  }, [index]);

  function onGalleryClick(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-shot]");
    if (!link) return;
    event.preventDefault();
    openerRef.current = link;
    setIndex(Number(link.dataset.shot));
  }

  const step = (by: number) => setIndex((current) => (current === null ? current : (current + by + total) % total));
  const close = () => dialogRef.current?.close();

  const image = index === null ? null : images[index];
  const caption = image ? (image.caption ?? image.alt) : "";
  const position = (index ?? 0) + 1;

  return (
    <div onClick={onGalleryClick}>
      {children}

      <dialog
        ref={dialogRef}
        aria-label={galleryCopy.viewerLabel}
        onClose={() => {
          setIndex(null);
          openerRef.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "ArrowRight") step(1);
        }}
        // A click anywhere but the image and the controls closes it.
        onClick={(event) => {
          if (!(event.target as Element).closest("img, button, figcaption")) close();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-text backdrop:bg-bg"
      >
        {image && (
          <div className="flex h-full flex-col gap-3 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p aria-hidden="true" className="font-mono text-xs text-text-muted tabular-nums">
                {position} / {total}
              </p>
              <button type="button" onClick={close} aria-label={galleryCopy.close} className={control}>
                <CloseIcon />
              </button>
            </div>

            <figure className="flex min-h-0 flex-1 flex-col gap-3">
              {/* Centred and scaled down to fit, keeping its ratio (the absolute box gives max-h a height). */}
              <div className="relative min-h-0 flex-1">
                <Image
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes="100vw"
                  loading="eager"
                  className="absolute inset-0 m-auto h-auto max-h-full w-auto max-w-full rounded-md border border-border"
                />
              </div>
              <figcaption className="text-center text-sm text-text">{caption}</figcaption>
            </figure>

            {/* Announces the new screenshot when moving through them. */}
            <p aria-live="polite" className="sr-only">
              {caption}, {galleryCopy.position(position, total)}
            </p>

            {total > 1 && (
              <div className="flex justify-center gap-3">
                <button type="button" onClick={() => step(-1)} aria-label={galleryCopy.previous} className={control}>
                  <ChevronLeftIcon />
                </button>
                <button type="button" onClick={() => step(1)} aria-label={galleryCopy.next} className={control}>
                  <ChevronRightIcon />
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
