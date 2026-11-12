"use client";

import { useState } from "react";
import { useBuildDock } from "@/lib/build-dock";
import { SHAPE_BY_SECTION } from "@/lib/build-sections";
import type { ShapeKey } from "@/lib/build-shapes";
import { useActiveSection } from "@/lib/use-active-section";

const SHAPES = [...new Set(Object.values(SHAPE_BY_SECTION))];
const REST: ShapeKey = "cube";

/**
 * The living header mark: the Build shape in miniature, and the big shape's dock. While the 3D companion
 * runs, it switches as each stop's beam starts printing and holds the shape between stops; otherwise it
 * shows the current home section's shape (the cube over the hero and off the home page). Static SVGs from
 * one cached sprite (src/app/build-marks.svg); switching assembles the new shape bottom up behind a tiny
 * beam while the old one drains away, in CSS (.header-mark), only with motion on. In the cube boot, one
 * block flies up from the cube into it before the mark builds (.boot-block, shown only then).
 * Decorative: the name link beside it carries the accessible name.
 */
export function HeaderMark() {
  const active = useActiveSection();
  const dock = useBuildDock();
  const current = dock ?? ((active && SHAPE_BY_SECTION[active]) || REST);

  // The beam plays on every switch, never on first paint.
  const [shown, setShown] = useState(current);
  const [switched, setSwitched] = useState(false);
  if (shown !== current) {
    setShown(current);
    setSwitched(true);
  }

  return (
    // The header has no room for it below 360px, nor just as the inline nav appears (768px up to 800px).
    <span
      aria-hidden="true"
      data-boot-mark=""
      className="header-mark relative size-6 shrink-0 max-[359px]:hidden md:max-[799px]:hidden"
    >
      {SHAPES.map((shape) => (
        <svg key={shape} data-on={shape === current || undefined} viewBox="0 0 24 24" className="absolute inset-0 size-full">
          <use href={`/build-marks.svg#${shape}`} />
        </svg>
      ))}
      {switched && <span key={current} className="header-mark-beam" />}
      <span className="boot-block" />
    </span>
  );
}
