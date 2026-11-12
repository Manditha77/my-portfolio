import { BOOT } from "./boot";
import { BUILD_SHAPES, DEFAULT_BLOCK, DEFAULT_VIEW, type Voxel } from "./build-shapes";
import { POSTER } from "./cube";
import { cubicBezier, easeOut, easePiston } from "./motion-tokens";

/*
 * The cube boot's "core growth" (ASSEMBLE), as data: the hero cube's 27 cells (its hidden centre included,
 * as the glowing core), which block each slides out of, when, and where it is drawn. The poster's SVG
 * (CSS keyframes) and the desktop 3D growth (growthAt, per frame) both read it, with the same timings and
 * curves, so either can take over from the other at any moment without a jump.
 * Each block slides one cell along a single axis out of a block already in place, growing from 0.6 to full
 * size with a small overshoot, and flashes accent as it snaps in: the 6 face blocks out of the core, the
 * 12 edges out of a face (vertically, except the 4 in the middle ring, which slide sideways), the 8 corners
 * out of an edge (vertically). Pure data and maths: no React, no three.js.
 */

export type GrowthKind = "core" | "face" | "edge" | "corner";

export type GrowthCell = {
  cell: Voxel;
  kind: GrowthKind;
  /** The block it slides out of, relative to its own cell (cells). Zero for the core. */
  from: Voxel;
  /** Desktop ms: it starts to slide, and first touches its slot. */
  at: number;
  contact: number;
  /** Its centre in the poster's frame (view units, y down), and its depth (larger is nearer). */
  x: number;
  y: number;
  depth: number;
};

/** Scale a block starts at, inside the block it slides out of. */
export const GROWTH_FROM_SCALE = 0.6;
/** Peak opacity of a block's accent flash as it snaps in (the 3D glow peaks at 1). */
export const FLASH_PEAK = 0.7;

const piston = cubicBezier(easePiston);
const easeOutCurve = cubicBezier(easeOut);

/** Share of the slide at which the piston curve first reaches its slot (its overshoot starts there). */
const CONTACT = (() => {
  let s = 0;
  while (s < 1 && piston(s) < 1) s += 0.005;
  return s;
})();

const STEP = BUILD_SHAPES.cube.step ?? 1;
/** View units per cell in the poster's frame, as The Build's 3D blocks rest. */
export const GROWTH_UNIT = POSTER.scale * STEP;
/** Half the size of the box that holds one block's drawing (view units), with room for its edges. */
export const BLOCK_HALF = Math.ceil((DEFAULT_BLOCK[0] * GROWTH_UNIT * Math.sqrt(3)) / 2) + 2;

/** The view rotation (three.js Euler "XYZ", as the 3D blocks and the header mark use). */
function view([x, y, z]: Voxel): [number, number, number] {
  const { pitch, yaw, roll } = { ...DEFAULT_VIEW, ...BUILD_SHAPES.cube.view };
  const [cr, sr, cy, sy, cp, sp] = [Math.cos(roll), Math.sin(roll), Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)];
  const x1 = x * cr - y * sr;
  const y1 = x * sr + y * cr;
  const x2 = x1 * cy + z * sy;
  const z2 = -x1 * sy + z * cy;
  return [x2, y1 * cp - z2 * sp, y1 * sp + z2 * cp];
}

function kindOf(cell: Voxel): GrowthKind {
  const nonZero = cell.filter((n) => n !== 0).length;
  return (["core", "face", "edge", "corner"] as const)[nonZero];
}

/** The cell a block slides out of: core for faces; for edges and corners, its neighbour towards y = 0 (or x = 0). */
function parentOf([x, y, z]: Voxel, kind: GrowthKind): Voxel {
  if (kind === "face") return [0, 0, 0];
  if (y !== 0) return [x, 0, z];
  return [0, y, z];
}

const STAGES: Record<Exclude<GrowthKind, "core">, { at: number; stagger: number }> = {
  face: { at: BOOT.facesAt, stagger: BOOT.faceStagger },
  edge: { at: BOOT.edgesAt, stagger: BOOT.edgeStagger },
  corner: { at: BOOT.cornersAt, stagger: BOOT.cornerStagger },
};

function buildCells(): GrowthCell[] {
  const cells: Voxel[] = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) cells.push([x, y, z]);
  // Within a stage, bottom to top, then around the vertical axis, so the contacts tick round the cube.
  const order = (cell: Voxel) => cell[1] * 10 + Math.atan2(cell[0], cell[2]);
  const counters = { face: 0, edge: 0, corner: 0 };
  return [...cells]
    .sort((a, b) => order(a) - order(b))
    .map((cell): GrowthCell => {
      const kind = kindOf(cell);
      const [px, py, pz] = parentOf(cell, kind);
      const at = kind === "core" ? BOOT.coreAt : STAGES[kind].at + counters[kind]++ * STAGES[kind].stagger;
      const [vx, vy, depth] = view([cell[0] * STEP, cell[1] * STEP, cell[2] * STEP]);
      return {
        cell,
        kind,
        from: kind === "core" ? [0, 0, 0] : [px - cell[0], py - cell[1], pz - cell[2]],
        at,
        contact: kind === "core" ? at + BOOT.core : at + CONTACT * BOOT.slide,
        x: POSTER.view / 2 + vx * POSTER.scale,
        y: POSTER.view / 2 - vy * POSTER.scale,
        depth,
      };
    });
}

/** The 27 cells, far to near: the order the poster paints them in. */
export const GROWTH_CELLS: readonly GrowthCell[] = buildCells().sort((a, b) => a.depth - b.depth);

/** Where `from` (cells) lands on the poster (view units, y down). */
export function projectOffset(from: Voxel): [number, number] {
  const [x, y] = view([from[0] * STEP, from[1] * STEP, from[2] * STEP]);
  return [x * POSTER.scale, -y * POSTER.scale];
}

const lastContact = (kind: GrowthKind) => Math.max(...GROWTH_CELLS.filter((c) => c.kind === kind).map((c) => c.contact));
const countUpTo = (kind: GrowthKind) => {
  const kinds: GrowthKind[] = ["core", "face", "edge", "corner"];
  return GROWTH_CELLS.filter((c) => kinds.indexOf(c.kind) <= kinds.indexOf(kind)).length;
};

/** The part counter under the cube: each count shows from `at` (desktop ms) until the next. */
export const GROWTH_COUNTS: readonly { at: number; count: number }[] = [
  { at: BOOT.coreAt, count: countUpTo("core") },
  { at: lastContact("face"), count: countUpTo("face") },
  { at: lastContact("edge"), count: countUpTo("edge") },
  { at: lastContact("corner"), count: countUpTo("corner") },
];
export const GROWTH_TOTAL = GROWTH_CELLS.length;

/**
 * The blocks that detach in the glide, each from a block on the cube's silhouette: the top one to the
 * header mark, the leftmost to the status dot, the lowest to "View my work". u, v: its centre as a share
 * of the poster's box from the centre; s: one block's drawing as a share of it.
 */
export const DETACH_FROM = (() => {
  const share = (cell: GrowthCell) => ({
    u: (cell.x - POSTER.view / 2) / POSTER.view,
    v: (cell.y - POSTER.view / 2) / POSTER.view,
    s: (2 * BLOCK_HALF) / POSTER.view,
  });
  const by = (score: (cell: GrowthCell) => number) =>
    share(GROWTH_CELLS.reduce((best, cell) => (score(cell) < score(best) ? cell : best)));
  return { mark: by((c) => c.y), dot: by((c) => c.x), cta: by((c) => -c.y) };
})();

export type GrowthState = {
  /** 0 = in the block it slides out of, 1 = in its slot (overshoots a little). */
  slide: number;
  /** Size, as a share of a full block (0 = not there yet). */
  scale: number;
  /** Accent glow, 0..1: the core's, and the flash as it snaps in. */
  glow: number;
};

/** A cell at `t` desktop ms into the boot: the same curves as the CSS keyframes ("Cube boot"). */
export function growthAt(cell: GrowthCell, t: number, out: GrowthState): GrowthState {
  if (cell.kind === "core") {
    out.slide = 1;
    out.scale = t < cell.at ? 0 : easeOutCurve((t - cell.at) / BOOT.core);
    out.glow = 1 - Math.min(1, Math.max(0, (t - BOOT.coreDimAt) / BOOT.coreDim));
    return out;
  }
  if (t < cell.at) {
    out.slide = 0;
    out.scale = 0;
    out.glow = 0;
    return out;
  }
  const eased = piston((t - cell.at) / BOOT.slide);
  out.slide = eased;
  out.scale = GROWTH_FROM_SCALE + (1 - GROWTH_FROM_SCALE) * eased;
  const flash = (t - cell.contact) / BOOT.flash;
  out.glow = flash >= 0 && flash < 1 ? 1 - flash : 0;
  return out;
}
