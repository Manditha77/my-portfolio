import type { CSSProperties } from "react";
import { BLOCK_HALF, GROWTH_CELLS, projectOffset } from "@/lib/boot-growth";
import { POSTER } from "@/lib/cube";
import { cx } from "@/lib/cx";

/*
 * Static poster for the hero visual: the hero cube (The Build's blocks, drawn flat at their exact 3D size
 * and angle) in a soft accent glow, with a second, flat glow just below it where it would meet the
 * perspective floor, so the cube reads as floating above it (on phones the glow reads as a shadow). Once
 * The Build's 3D cube has taken over, both glows follow it (--hero-presence, set by parts-cube.tsx): they
 * fade out as it dissolves on scroll and return with it. In the light theme the glow over the cube is hidden
 * (.hero-glow-over); a soft teal halo behind the cube takes its place (hero.tsx, globals.css .hero-halo).
 * It also plays its part of the cube boot (src/lib/boot.ts) in CSS: at the viewport centre a glowing core
 * appears, the face, edge and corner blocks slide out of it and snap in (src/lib/boot-growth.ts), then it
 * glides into this slot (FLIP: .boot-cube). Its resting state, with motion off, on a return visit and
 * without JS, is the finished cube in place (globals.css, "Cube boot").
 * Rendered on the server as inline SVG, with no client JS. Every block is one <use> of the same block in
 * the header mark's sprite (/build-marks.svg, already loaded for the header), painted far to near, which
 * keeps the document small. It is also the fallback and loading state for the 3D element (see HeroVisual).
 */

const VIEW = POSTER.view;
const CENTER = VIEW / 2;

// The cube's lowest corner is at y ≈ 350; the floor glow sits a little below it.
const FLOOR_GLOW = { cy: 374, rx: 128, ry: 16 };
// The core's glow, while the cube grows around it.
const CORE_GLOW = 90;

const SIZE = 2 * BLOCK_HALF;

/** One block's place in the boot (globals.css): where it slides from (view units), and when. */
const part = (from: readonly [number, number, number], at: number, contact: number) => {
  const [fx, fy] = projectOffset(from);
  return {
    "--fx": `${Math.round(fx * 10) / 10}px`,
    "--fy": `${Math.round(fy * 10) / 10}px`,
    "--at": `${Math.round(at)}ms`,
    "--contact": `${Math.round(contact)}ms`,
  } as CSSProperties;
};

type HeroPosterProps = {
  className?: string;
};

export function HeroPoster({ className }: HeroPosterProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={cx("boot-cube size-full", className)}
    >
      <defs>
        <radialGradient id="hero-poster-glow">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-poster-floor-glow">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-poster-core-glow">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Faint until the cube settles onto the floor in the boot. Both glows follow the 3D cube (.hero-glow). */}
      <g className="hero-glow">
        <ellipse className="seq-floor-glow" cx={CENTER} {...FLOOR_GLOW} fill="url(#hero-poster-floor-glow)" />
      </g>

      {/* The core's glow, behind the blocks: only while the cube grows. */}
      <circle className="seq-core-glow" cx={CENTER} cy={CENTER} r={CORE_GLOW} fill="url(#hero-poster-core-glow)" />

      {/* The solid cube, block by block, far to near (the hidden ones are covered at rest). It fades out once
          HeroVisual's 3D cube has taken its place; the glows stay as its backdrop. In the boot each block
          slides out of the one before it and flashes as it snaps in. */}
      <g className="transition-opacity duration-slow group-data-[3d=ready]:opacity-0">
        <g className="seq-parts">
          {GROWTH_CELLS.map(({ cell, kind, from, at, contact, x, y }) => (
            <g key={cell.join()} className={kind === "core" ? "seq-core" : "seq-part"} style={part(from, at, contact)}>
              <use href="/build-marks.svg#cube-block" x={x - BLOCK_HALF} y={y - BLOCK_HALF} width={SIZE} height={SIZE} />
              <use
                className="seq-flash"
                href="/build-marks.svg#cube-flash"
                x={x - BLOCK_HALF}
                y={y - BLOCK_HALF}
                width={SIZE}
                height={SIZE}
              />
            </g>
          ))}
        </g>
      </g>

      {/* Over the cube, as it lies over the 3D canvas, so both read the same. Light: hidden (the halo instead). */}
      <g className="hero-glow hero-glow-over">
        <circle cx={CENTER} cy={CENTER} r={CENTER} fill="url(#hero-poster-glow)" />
      </g>
    </svg>
  );
}
