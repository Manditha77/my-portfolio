import Image from "next/image";
import type { ContentImage } from "@/content/types";
import type { ScreenshotShape } from "@/content/xr";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { cx } from "@/lib/cx";

type CaseStudyGalleryProps = {
  images: readonly ContentImage[];
  shape: ScreenshotShape;
};

const layouts = {
  landscape: {
    grid: "sm:grid-cols-2",
    sizes: "(min-width: 1100px) 530px, (min-width: 640px) 50vw, 100vw",
  },
  // Two phones side by side at 360px, four across from 640px.
  phone: {
    grid: "grid-cols-2 sm:grid-cols-4",
    sizes: "(min-width: 1100px) 260px, (min-width: 640px) 25vw, 50vw",
  },
} as const;

/** Captioned screenshots: 16:9 tiles, or phone-shaped tiles for portrait phone captures. */
export function CaseStudyGallery({ images, shape }: CaseStudyGalleryProps) {
  const layout = layouts[shape];

  return (
    <ul role="list" className={cx("mt-6 grid gap-6", layout.grid)}>
      {images.map((image) => {
        const picture = (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes={layout.sizes}
            className="size-full object-cover"
          />
        );

        return (
          <li key={image.src}>
            <figure>
              {shape === "phone" ? (
                <PhoneFrame>{picture}</PhoneFrame>
              ) : (
                <div className="aspect-video overflow-hidden rounded-md border border-border bg-bg">{picture}</div>
              )}
              <figcaption className="mt-2 text-sm text-text-muted">{image.alt}</figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
