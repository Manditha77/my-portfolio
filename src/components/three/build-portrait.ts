import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import { BLOCK, BLOCKS, createPoses, type Pose } from "./build-poses";
import { VIEW_UNITS } from "./build-scroll";
import data from "./portrait.json";

/*
 * "The Build": the hero's block portrait (CLAUDE.md §6). The data comes from scripts/portrait (a relief made
 * offline from a photo: per cell, how far its pin stands out and how light it is). Every block is a pin
 * standing out of a backplate; below `dissolveFrom` the shoulders thin out and their blocks drift a little,
 * and a few loose ones drift further. The static posters (scripts/portrait/render_poster.py) draw exactly
 * this layout, so the canvas can take the poster's place without a visible change: keep the two in step.
 *
 * Instances 0..BLOCKS-1 are the handoff set, spread evenly over the head and shoulders: they are the blocks
 * The Build carries on into every section's shape. The rest only exist in the hero; when the hero streams
 * away they fall a little and fade. Only imported by lazy 3D code.
 */

type PortraitData = {
  cols: number;
  rows: number;
  depthLevels: number;
  shadeLevels: number;
  blocks: number;
  dissolveFrom: number;
  /** Per row, one hex digit per block (space: no block). */
  depth: string[];
  shade: string[];
  /** [col, row] of the blocks that drifted loose. */
  loose: number[][];
  /** Empty cells around the grid in the poster's frame. */
  margin: number;
  posterHeight: number;
};

const portrait: PortraitData = data;

export const PORTRAIT_BLOCKS = portrait.blocks;

// One depth level is this many cells of pin length; a pin's face is this share of its cell.
const DEPTH_STEP = 0.75;
const FILL = 0.9;

/**
 * Cell size, companion units: the poster's frame (the grid plus its margin) is exactly as tall as the hero
 * visual, as the poster's object-contain places it.
 */
const CELL = VIEW_UNITS / (portrait.rows + 2 * portrait.margin);

/**
 * Portrait edge-line strength for a hero visual `heroWidth` CSS px wide: lines fade when cells are only a few
 * pixels across, or they would swamp the picture. Measured as at 1.5x, the poster's resolution, so the canvas
 * matches the poster on any screen.
 */
export function portraitEdge(heroWidth: number): number {
  const cellPx = (1.5 * heroWidth * CELL) / VIEW_UNITS;
  return MathUtils.clamp((cellPx - 4) / 8, 0.15, 1);
}

/** A repeatable 0..1 value per cell and channel (render_poster.py has the same one). */
function hash(c: number, r: number, k: number): number {
  const x = Math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453;
  return x - Math.floor(x);
}

type Cell = { c: number; r: number; depth: number; shade: number };

function readCells(): Cell[] {
  const cells: Cell[] = [];
  portrait.depth.forEach((row, r) => {
    [...row].forEach((char, c) => {
      if (char === " ") return;
      cells.push({ c, r, depth: Number.parseInt(char, 16), shade: Number.parseInt(portrait.shade[r][c], 16) });
    });
  });
  return cells;
}

/**
 * Handoff set first: every few cells across the head and shoulders (above the dissolve), thinned evenly to
 * exactly BLOCKS; then the rest in reading order.
 */
function order(cells: Cell[]): Cell[] {
  const solid = cells.filter((cell) => cell.r < portrait.dissolveFrom);
  const stride = Math.max(1, Math.floor(Math.sqrt(solid.length / BLOCKS)));
  const offset = Math.floor(stride / 2);
  let lattice = solid.filter((cell) => cell.r % stride === offset && cell.c % stride === offset);
  if (lattice.length < BLOCKS) lattice = solid;
  const handoff = Array.from({ length: BLOCKS }, (_, i) => lattice[Math.floor((i * lattice.length) / BLOCKS)]);
  const chosen = new Set(handoff);
  return [...handoff, ...cells.filter((cell) => !chosen.has(cell))];
}

const CELLS = order(readCells());
if (CELLS.length !== PORTRAIT_BLOCKS) throw new Error("Portrait data and block count disagree");

// Pins turn about the middle of their depth range, so a turn keeps the portrait centred.
const PIVOT_Z = 0.5 * portrait.depthLevels * DEPTH_STEP;

const euler = new Euler();
const turn = new Quaternion();

function restPose(cell: Cell, loose: Set<string>, pose: Pose) {
  const { c, r, depth, shade } = cell;
  const { cols, rows, dissolveFrom } = portrait;
  const length = (depth + 1) * DEPTH_STEP;
  const t = Math.max(0, (r - dissolveFrom) / Math.max(1, rows - dissolveFrom));
  const drift = loose.has(`${c},${r}`) ? 1.6 : t;
  pose.position
    .set(
      c - cols / 2 + 0.5 + (hash(c, r, 1) - 0.5) * 0.5 * drift,
      rows / 2 - r - 0.5 + (hash(c, r, 2) - 0.5) * 0.4 * drift - 0.25 * drift,
      length / 2 + hash(c, r, 3) * 2 * drift - PIVOT_Z,
    )
    .multiplyScalar(CELL);
  pose.quaternion.setFromEuler(euler.set((hash(c, r, 4) - 0.5) * 0.7 * drift, (hash(c, r, 5) - 0.5) * 0.7 * drift, 0));
  pose.scale.set(FILL, FILL, length).multiplyScalar(CELL / BLOCK);
  pose.glow = 0;
  pose.shade = shade / (portrait.shadeLevels - 1);
  pose.portrait = 1;
  pose.opacity = 1;
}

/** The portrait at rest, companion units around its centre (+y up). */
export const PORTRAIT_REST: readonly Pose[] = (() => {
  const loose = new Set(portrait.loose.map(([c, r]) => `${c},${r}`));
  const poses = createPoses(PORTRAIT_BLOCKS);
  CELLS.forEach((cell, i) => restPose(cell, loose, poses[i]));
  return poses;
})();

// Leaving: blocks start apart over STAGGER of the stretch, bottom first with a little jitter so the portrait
// crumbles rather than wiping row by row.
const STAGGER = 0.6;
const JITTER = 0.12;
const START = CELLS.map(({ c, r }) => {
  const fromBottom = (portrait.rows - 1 - r) / (portrait.rows - 1);
  return STAGGER * MathUtils.clamp(fromBottom + (hash(c, r, 6) - 0.5) * JITTER, 0, 1);
});

// The rest fall this far (companion units, plus up to FALL_MORE), drifting sideways and tumbling a little,
// and shrink to SHRINK of their size as they fade.
const FALL = 0.45;
const FALL_MORE = 0.3;
const DRIFT = 0.12;
const TUMBLE = 1.2;
const SHRINK = 0.6;

const easeIn = (t: number) => t ** 3;
const axis = new Vector3();

/**
 * Writes the portrait leaving (`k` 0..1, scrubbed) into `out`, around the portrait's centre. The handoff set
 * falls to just below `bottom` (the hero band's edge, companion units relative to the centre, +y up) while
 * growing into its blocks' size and angle in the next shape (`next`, or nothing) and taking on the plain
 * block look; the rest fall a little and fade.
 */
export function portraitExit(k: number, out: Pose[], bottom: number, next: readonly Pose[] | null) {
  for (let i = 0; i < PORTRAIT_BLOCKS; i++) {
    const from = PORTRAIT_REST[i];
    const to = out[i];
    const local = MathUtils.clamp((k - START[i]) / (1 - STAGGER), 0, 1);
    const away = easeIn(local);
    to.glow = 0;
    to.shade = from.shade;
    to.position.copy(from.position);

    if (i < BLOCKS) {
      const target = next?.[i];
      const grow = MathUtils.smoothstep(local, 0, 0.5);
      to.scale.copy(from.scale);
      to.quaternion.copy(from.quaternion);
      if (target) {
        to.scale.lerp(target.scale, grow);
        to.quaternion.slerp(target.quaternion, grow);
      } else {
        to.scale.multiplyScalar(1 - grow);
      }
      const radius = 0.5 * BLOCK * to.scale.length();
      to.position.y = MathUtils.lerp(from.position.y, bottom - radius, away);
      to.portrait = 1 - grow;
      to.opacity = 1;
      continue;
    }

    const { c, r } = CELLS[i];
    to.position.x += (hash(c, r, 7) - 0.5) * 2 * DRIFT * away;
    to.position.y -= (FALL + FALL_MORE * hash(c, r, 8)) * away;
    axis.set(hash(c, r, 9) - 0.5, hash(c, r, 10) - 0.5, 0.2).normalize();
    to.quaternion.copy(from.quaternion).multiply(turn.setFromAxisAngle(axis, TUMBLE * away));
    to.scale.copy(from.scale).multiplyScalar(MathUtils.lerp(1, SHRINK, away));
    to.portrait = 1;
    to.opacity = 1 - MathUtils.smoothstep(local, 0.1, 0.8);
  }
}
