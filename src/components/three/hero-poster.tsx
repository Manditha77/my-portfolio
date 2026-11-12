import type { CSSProperties } from "react";
import { BUILD_SHAPES } from "@/lib/build-shapes";
import { POSTER, blueprintGeometry } from "@/lib/cube";
import { cx } from "@/lib/cx";
import { BOOT, layerAt } from "@/lib/boot";

/*
 * Static poster for the hero visual: the hero cube (The Build's 26 blocks, drawn flat at their exact 3D
 * size and angle) in a soft accent glow, with a second, flat glow just below it where it would meet the
 * perspective floor, so the cube reads as floating above it (on phones the glow reads as a shadow).
 * It also plays its part of the cube boot (src/lib/boot.ts) in CSS: it starts at the viewport centre as a
 * faint outline, the blueprint traces itself, the beam scans up through it, the blocks print in layer by
 * layer, then it glides into this slot (FLIP: .boot-cube). Its resting state, with motion off, on a return
 * visit and without JS, is the finished cube in place (globals.css, "Cube boot").
 * Rendered on the server as inline SVG, with no client JS. The solid cube's layers come from the header
 * mark's sprite (/build-marks.svg, already loaded for the header), which keeps the document small. It is
 * also the fallback and loading state for the 3D element (see HeroVisual).
 */

const VIEW = POSTER.view;
const CENTER = VIEW / 2;

const blueprint = blueprintGeometry(POSTER);
/** The cube's voxel layers, bottom first (symbols cube-0… in the sprite). */
const LAYERS = new Set(BUILD_SHAPES.cube.groups.flatMap((group) => group.voxels.map(([, y]) => y))).size;
// The cube's lowest corner is at y ≈ 350; the floor glow sits a little below it.
const FLOOR_GLOW = { cy: 374, rx: 128, ry: 16 };
// The beam overhangs the cube a little on each side, and its trail fades out below it.
const BEAM = { overhang: 24, trail: 36 };

/** CSS custom properties: timing for the boot's keyframes (globals.css); --dur is shared by a group. */
const timing = (delay: number, duration?: number) =>
  ({ "--delay": `${delay}ms`, ...(duration === undefined ? {} : { "--dur": `${duration}ms` }) }) as CSSProperties;

type HeroPosterProps = {
  className?: string;
};

export function HeroPoster({ className }: HeroPosterProps) {
  const beamWidth = blueprint.right - blueprint.left + 2 * BEAM.overhang;

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={cx("boot-cube size-full", className)}
      style={{ "--rise": `${blueprint.top - blueprint.bottom}px` } as CSSProperties}
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
        <linearGradient id="hero-poster-beam" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="20%" stopColor="var(--accent)" />
          <stop offset="80%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-poster-trail" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Faint until the cube settles onto the floor in the boot. */}
      <ellipse className="seq-floor-glow" cx={CENTER} {...FLOOR_GLOW} fill="url(#hero-poster-floor-glow)" />

      {/* act: the solid cube, one layer at a time (bottom first, so each covers the one below). It fades
          out once HeroVisual's 3D cube has taken its place; the glows stay as its backdrop. */}
      <g
        className="transition-opacity duration-slow group-data-[3d=ready]:opacity-0"
        style={{ "--dur": `${BOOT.layerDraw}ms` } as CSSProperties}
      >
        {Array.from({ length: LAYERS }, (_, layer) => (
          <g key={layer} className="seq-layer" style={timing(layerAt(layer))}>
            <use href={`/build-marks.svg#cube-${layer}`} width={VIEW} height={VIEW} />
          </g>
        ))}
      </g>

      {/* Over the cube, as it lies over the 3D canvas, so both read the same. */}
      <circle cx={CENTER} cy={CENTER} r={CENTER} fill="url(#hero-poster-glow)" />

      {/* The boot's first frame: a faint outline of the cube at the viewport centre, until the blueprint
          has traced over it. Hidden at rest. */}
      <g className="seq-ghost stroke-accent" fill="none" strokeWidth={1.5} strokeOpacity={0.3}>
        {blueprint.edges.map(({ key, d, back }) => (
          <path key={key} d={d} strokeOpacity={back ? 0.12 : undefined} />
        ))}
      </g>

      {/* sense: the blueprint traces itself, then fades as the cube completes. Hidden at rest. */}
      <g
        className="seq-blueprint stroke-accent"
        fill="none"
        style={timing(BOOT.actEnd, BOOT.blueprintFade)}
      >
        <g strokeWidth={1.5} strokeOpacity={0.9} style={{ "--line": `${BOOT.edgeDraw}ms` } as CSSProperties}>
          {blueprint.edges.map(({ key, d, back }, i) => (
            <path
              key={key}
              d={d}
              pathLength={1}
              strokeOpacity={back ? 0.35 : undefined}
              style={timing(BOOT.senseAt + i * BOOT.edgeStagger)}
            />
          ))}
        </g>
        <g strokeWidth={1} strokeOpacity={0.4} style={{ "--line": `${BOOT.gridDraw}ms` } as CSSProperties}>
          {blueprint.grid.map(({ key, d }, i) => (
            <path key={key} d={d} pathLength={1} style={timing(BOOT.gridAt + i * BOOT.gridStagger)} />
          ))}
        </g>
      </g>

      {/* analyze: the build beam scans up through the blueprint once, its trail below it. Hidden at rest. */}
      <g className="seq-beam" style={timing(BOOT.analyzeAt, BOOT.actAt - BOOT.analyzeAt)}>
        <rect
          x={blueprint.left - BEAM.overhang}
          y={blueprint.bottom}
          width={beamWidth}
          height={BEAM.trail}
          fill="url(#hero-poster-trail)"
        />
        <rect
          x={blueprint.left - BEAM.overhang}
          y={blueprint.bottom - 1}
          width={beamWidth}
          height={2}
          fill="url(#hero-poster-beam)"
        />
      </g>
    </svg>
  );
}
