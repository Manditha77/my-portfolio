"use client";

import { SHAPE_BY_SECTION } from "@/lib/build-sections";
import type { ShapeKey } from "@/lib/build-shapes";
import { useActiveSection } from "@/lib/use-active-section";

const SHAPES = [...new Set(Object.values(SHAPE_BY_SECTION))];
const REST: ShapeKey = "cube";

/**
 * The living header mark: the current home section's Build shape in miniature (the cube over the hero and
 * off the home page). Static SVGs from one cached sprite (src/app/build-marks.svg); switching assembles
 * the new shape bottom up while the old one drains away, in CSS (.header-mark), only with motion on.
 * Decorative: the name link beside it carries the accessible name.
 */
export function HeaderMark() {
  const active = useActiveSection();
  const current = (active && SHAPE_BY_SECTION[active]) || REST;

  return (
    // The header has no room for it below 360px, nor just as the inline nav appears (768px up to 800px).
    <span
      aria-hidden="true"
      className="header-mark relative size-6 shrink-0 max-[359px]:hidden md:max-[799px]:hidden"
    >
      {SHAPES.map((shape) => (
        <svg key={shape} data-on={shape === current || undefined} viewBox="0 0 24 24" className="absolute inset-0 size-full">
          <use href={`/build-marks.svg#${shape}`} />
        </svg>
      ))}
    </span>
  );
}
