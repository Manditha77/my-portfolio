import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import {
  BUILD_BLOCKS,
  BUILD_SHAPES,
  DEFAULT_BLOCK,
  DEFAULT_VIEW,
  SHAPE_SIZE,
  type LiveRole,
  type ShapeKey,
} from "@/lib/build-shapes";
import { SWAY, liveBlock, liveExtremes, liveSway, type LiveBlock, type Sway } from "./build-live";

/*
 * "The Build": turns the voxel shapes (src/lib/build-shapes.ts) into one pose per block, prints them into
 * their box with the build beam and dissolves them out of it, and flies the hero cube in. Positions are in companion units, centred on the shape; scales multiply the
 * 0.6 block geometry. placePoses then moves a set of poses to its spot on the page. Only imported by lazy
 * 3D code.
 */

export type Pose = { position: Vector3; quaternion: Quaternion; scale: Vector3; glow: number };

export type PoseInput = {
  /** Hero cube: spin and pointer tilt (radians) and separation (0 = assembled, 1 = fully apart). */
  spin: number;
  tiltX: number;
  tiltY: number;
  separation: number;
  /** 0 = placed groups hover at their offset, 1 = settled into the shape. */
  settle: number;
  /** Live actions (build-live.ts): 0 = at rest, 1 = full, and the seconds since the shape formed. */
  live: number;
  time: number;
};

export const REST: PoseInput = { spin: 0, tiltX: 0, tiltY: 0, separation: 0, settle: 1, live: 0, time: 0 };

export const BLOCKS = BUILD_BLOCKS;
/** Edge length of the block geometry, companion units. */
export const BLOCK = 0.6;

// Kept small so a fully separated hero cube's diagonal still fits inside its box.
const SPREAD = 0.25;

type CompiledBlock = { local: Vector3; pivot: Vector3; group: number; member: number };

type CompiledGroup = {
  axis: Vector3;
  angle: number;
  place: Vector3 | null;
  live: LiveRole | null;
  count: number;
  /** Multiplies the block geometry. */
  scale: Vector3;
  /** Half-diagonal of one block, voxels. */
  radius: number;
};

type CompiledShape = {
  blocks: CompiledBlock[];
  groups: CompiledGroup[];
  pitch: number;
  yaw: number;
  roll: number;
  step: number;
  sway: Sway;
  /** Centre of the shape's on-screen box (live actions and sway included), in view space at rest. */
  centre: Vector3;
  /** On-screen size, companion units (blocks, live actions and sway included). */
  width: number;
  height: number;
  /** Largest block's half-diagonal, companion units. */
  blockRadius: number;
};

type Bounds = { left: number; right: number; bottom: number; top: number };

const AXES = { x: new Vector3(1, 0, 0), y: new Vector3(0, 1, 0), z: new Vector3(0, 0, 1) } as const;

const euler = new Euler();
const viewQ = new Quaternion();
const turnQ = new Quaternion();
const point = new Vector3();
const offset = new Vector3();
const live: LiveBlock = { offset: new Vector3(), angle: 0, glow: 0 };
const sway: Sway = { pitch: 0, yaw: 0, roll: 0, bob: 0 };

/** Where `block` sits in the shape's frame (voxels), its group turned by an extra `angle` after `shift`. */
function blockPoint(shape: Pick<CompiledShape, "groups">, block: CompiledBlock, shift: Vector3, angle: number) {
  const group = shape.groups[block.group];
  turnQ.setFromAxisAngle(group.axis, group.angle + angle);
  return point.copy(block.local).add(shift).applyQuaternion(turnQ).add(block.pivot);
}

/**
 * On-screen box of a shape over a set of view rotations: every block settled, hovering (placed groups) and
 * at each live extreme, plus its half-diagonal; then the sway's bob above and below.
 */
function measure(
  shape: Omit<CompiledShape, "centre" | "width" | "height" | "blockRadius">,
  views: Quaternion[],
  withLive: boolean,
): Bounds {
  const bounds: Bounds = { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity };
  const zero = new Vector3();
  for (const view of views) {
    for (const block of shape.blocks) {
      const group = shape.groups[block.group];
      const extremes = withLive && group.live ? liveExtremes(group.live, group.angle) : [];
      const samples = [{ shift: zero, angle: 0, hover: false }];
      if (group.place) samples.push({ shift: zero, angle: 0, hover: true });
      for (const extreme of extremes) samples.push({ shift: new Vector3(...extreme.offset), angle: extreme.angle, hover: false });
      const radius = group.radius * shape.step;
      for (const sample of samples) {
        blockPoint(shape, block, sample.shift, sample.angle);
        if (sample.hover && group.place) point.add(group.place);
        point.multiplyScalar(shape.step).applyQuaternion(view);
        bounds.left = Math.min(bounds.left, point.x - radius);
        bounds.right = Math.max(bounds.right, point.x + radius);
        bounds.bottom = Math.min(bounds.bottom, point.y - radius);
        bounds.top = Math.max(bounds.top, point.y + radius);
      }
    }
  }
  if (withLive) {
    bounds.bottom -= shape.sway.bob;
    bounds.top += shape.sway.bob;
  }
  return bounds;
}

/** The view rotations a shape reaches: its own, and every corner of its sway. */
function swayViews(pitch: number, yaw: number, roll: number, amplitude: Sway): Quaternion[] {
  const signs = (a: number) => (a ? [-a, 0, a] : [0]);
  const views: Quaternion[] = [];
  for (const p of signs(amplitude.pitch)) {
    for (const y of signs(amplitude.yaw)) {
      for (const r of signs(amplitude.roll)) views.push(new Quaternion().setFromEuler(euler.set(pitch + p, yaw + y, roll + r)));
    }
  }
  return views;
}

function compile(key: ShapeKey): CompiledShape {
  const shape = BUILD_SHAPES[key];
  const fill = shape.block ?? DEFAULT_BLOCK;
  const blocks: CompiledBlock[] = [];
  const groups: CompiledGroup[] = shape.groups.map((group) => ({
    axis: AXES[group.turn?.axis ?? "z"],
    angle: group.turn?.angle ?? 0,
    place: group.place ? new Vector3(...group.place) : null,
    live: group.live ?? null,
    count: group.voxels.length,
    scale: new Vector3(...(group.block ?? fill)),
    radius: 0.5 * Math.hypot(...(group.block ?? fill)),
  }));
  shape.groups.forEach((group, index) => {
    const pivot = new Vector3(...(group.turn?.pivot ?? [0, 0, 0]));
    group.voxels.forEach((voxel, member) => {
      blocks.push({ local: new Vector3(...voxel).sub(pivot), pivot, group: index, member });
    });
  });
  if (blocks.length > BLOCKS) throw new Error(`Build shape "${key}" has more than ${BLOCKS} voxels`);
  // Assembly order: bottom to top, with placed groups last.
  const placed = (block: CompiledBlock) => (groups[block.group].place ? 1 : 0);
  blocks.sort(
    (a, b) =>
      placed(a) - placed(b) ||
      a.local.y + a.pivot.y - (b.local.y + b.pivot.y) ||
      a.local.x + a.pivot.x - (b.local.x + b.pivot.x),
  );

  const pitch = shape.view?.pitch ?? DEFAULT_VIEW.pitch;
  const yaw = shape.view?.yaw ?? DEFAULT_VIEW.yaw;
  const roll = shape.view?.roll ?? DEFAULT_VIEW.roll;

  // Voxel positions with their groups turned, then the largest extent fitted into SHAPE_SIZE.
  const zero = new Vector3();
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  blocks.forEach((block) => {
    blockPoint({ groups }, block, zero, 0);
    min.min(point);
    max.max(point);
  });
  const extent = Math.max(max.x - min.x, max.y - min.y, max.z - min.z) + 1;
  const step = shape.step ?? SHAPE_SIZE / extent;
  groups.forEach((group) => group.scale.multiplyScalar(step / BLOCK));

  const compiled = { blocks, groups, pitch, yaw, roll, step, sway: SWAY[key] };
  const { left, right, bottom, top } = measure(compiled, swayViews(pitch, yaw, roll, compiled.sway), true);
  return {
    ...compiled,
    centre: new Vector3((left + right) / 2, (bottom + top) / 2, 0),
    width: right - left,
    height: top - bottom,
    blockRadius: Math.max(...groups.map((group) => 0.5 * BLOCK * group.scale.length())),
  };
}

const SHAPES = Object.fromEntries(
  (Object.keys(BUILD_SHAPES) as ShapeKey[]).map((key) => [key, compile(key)]),
) as Record<ShapeKey, CompiledShape>;

/** On-screen size of a shape (live actions and sway included), companion units, for fitting it into a box. */
export function shapeSize(key: ShapeKey): { width: number; height: number } {
  return SHAPES[key];
}

export function createPoses(): Pose[] {
  return Array.from({ length: BLOCKS }, () => ({
    position: new Vector3(),
    quaternion: new Quaternion(),
    scale: new Vector3(1, 1, 1),
    glow: 0,
  }));
}

/** Writes one pose per block for `key` into `out`; blocks the shape doesn't use tuck into its centre. */
export function fillShape(key: ShapeKey, out: Pose[], input: PoseInput) {
  const shape = SHAPES[key];
  const weight = input.live;
  liveSway(shape.sway, input.time, sway);
  viewQ.setFromEuler(
    euler.set(
      shape.pitch + input.tiltX + weight * sway.pitch,
      shape.yaw + input.spin + input.tiltY + weight * sway.yaw,
      shape.roll + weight * sway.roll,
    ),
  );
  const spread = 1 + SPREAD * input.separation;
  const step = shape.step * spread;
  const bob = weight * sway.bob;

  for (let i = 0; i < BLOCKS; i++) {
    const pose = out[i];
    const block = shape.blocks[i];
    if (!block) {
      pose.position.set(0, 0, 0);
      pose.quaternion.copy(viewQ);
      pose.scale.setScalar(0);
      pose.glow = 0;
      continue;
    }
    const group = shape.groups[block.group];
    let angle = 0;
    offset.set(0, 0, 0);
    pose.glow = 0;
    if (group.live && weight > 0) {
      liveBlock(group.live, block.member, group.count, group.angle, input.time, live);
      offset.copy(live.offset).multiplyScalar(weight);
      angle = weight * live.angle;
      pose.glow = weight * live.glow;
    }
    pose.position.copy(blockPoint(shape, block, offset, angle));
    if (group.place) pose.position.addScaledVector(group.place, 1 - input.settle);
    pose.position
      .multiplyScalar(step)
      .applyQuaternion(viewQ)
      .addScaledVector(shape.centre, -spread);
    pose.position.y += bob;
    pose.quaternion.multiplyQuaternions(viewQ, turnQ);
    pose.scale.copy(group.scale);
  }
}

/** Moves poses onto the page: scaled by `size`, centred on (x, y) in page units (page px / zoom, +y up). */
export function placePoses(poses: Pose[], x: number, y: number, size: number) {
  for (const pose of poses) {
    pose.position.multiplyScalar(size);
    pose.position.x += x;
    pose.position.y += y;
    pose.scale.multiplyScalar(size);
  }
}

/*
 * The build beam: a thin accent line that prints a shape layer by layer as it rises through it, and
 * dissolves it top down as it falls. A block materialises over PRINT_BAND of its own size behind the line
 * (growing from nothing, settling a little from above), and glows where the line touches it.
 */

/** How far past a block the beam travels while it materialises, in block diameters. */
const PRINT_BAND = 1.2;
/** How far the beam's glow trails on a block it has passed, in block diameters. */
const FLASH_BAND = 2.5;
/** Accent share of a block the beam is touching. */
const FLASH_GLOW = 0.7;
/** Printed blocks settle down from this share of their radius above their slot. */
const SETTLE_DROP = 0.6;

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t ** 3;

/**
 * Where a shape's beam starts and ends, as a half-height around its centre (companion units; multiply by
 * the stop's scale): the shape's on-screen extent plus one block, so the line starts below every block
 * and has finished printing the top one when it stops.
 */
export function beamHalf(key: ShapeKey): number {
  const shape = SHAPES[key];
  return shape.height / 2 + shape.blockRadius;
}

/**
 * Writes `placed` (poses on the page) printed or dissolved by a beam at `beam` (page units, +y up) into
 * `out`. "in": the beam rises, and blocks below it have materialised; "out": it falls, and blocks above it
 * have dissolved. Reversible: it only depends on where the beam is.
 */
export function printPoses(placed: Pose[], out: Pose[], beam: number, direction: "in" | "out") {
  for (let i = 0; i < BLOCKS; i++) {
    const from = placed[i];
    const to = out[i];
    to.position.copy(from.position);
    to.quaternion.copy(from.quaternion);
    to.glow = from.glow;
    const radius = 0.5 * BLOCK * from.scale.length();
    if (radius === 0) {
      to.scale.setScalar(0);
      continue;
    }
    // How far the beam has gone past the block's leading edge.
    const past = direction === "in" ? beam - (from.position.y - radius) : from.position.y + radius - beam;
    const amount = MathUtils.clamp(past / (2 * radius * PRINT_BAND), 0, 1);
    const shown = direction === "in" ? easeOut(amount) : 1 - easeIn(amount);
    to.position.y += (1 - shown) * SETTLE_DROP * radius;
    to.scale.copy(from.scale).multiplyScalar(shown);
    if (past > 0) to.glow = Math.max(to.glow, FLASH_GLOW * Math.max(0, 1 - past / (2 * radius * FLASH_BAND)));
  }
}

/**
 * The beam's opacity at `beam` (page units, +y up) over `placed`, printing ("in") or dissolving ("out").
 * It follows where the beam is, not the scroll, so the line is only there while blocks are changing: it
 * fades in over one block before its first contact, and is gone by the time the last block is complete
 * (printing: the top block fully grown; dissolving: the bottom block fully gone). Once a shape is formed
 * there is never a line hanging over it, wherever the scroll parks.
 */
export function beamOpacity(placed: Pose[], beam: number, direction: "in" | "out"): number {
  let bottom = Infinity;
  let top = -Infinity;
  let bottomRadius = 0;
  let topRadius = 0;
  for (let i = 0; i < BLOCKS; i++) {
    const pose = placed[i];
    const radius = 0.5 * BLOCK * pose.scale.length();
    if (radius === 0) continue;
    if (pose.position.y - radius < bottom) {
      bottom = pose.position.y - radius;
      bottomRadius = radius;
    }
    if (pose.position.y + radius > top) {
      top = pose.position.y + radius;
      topRadius = radius;
    }
  }
  if (top < bottom) return 0;
  // A block finishes this far past its trailing edge (printPoses: PRINT_BAND of its diameter, from its leading edge).
  const overshoot = (radius: number) => (2 * PRINT_BAND - 2) * radius;
  // Rising, the beam meets the bottom first and finishes past the top; falling, the reverse.
  const low = direction === "in" ? bottom : bottom - overshoot(bottomRadius);
  const high = direction === "in" ? top + overshoot(topRadius) : top;
  const fadeLow = 2 * bottomRadius;
  const fadeHigh = 2 * topRadius;
  return MathUtils.smoothstep(beam, low - fadeLow, low) * (1 - MathUtils.smoothstep(beam, high - fadeHigh, high));
}

/*
 * The hero creation (once per page load): the cube's blocks fly in from deep in the background, small and
 * scattered, and land as a rising beam passes them, so the cube is printed layer by layer. Seconds.
 */
export const INTRO = {
  /** The blocks fade in where they wait. */
  appear: 0.35,
  /** Each block's flight, ending as the beam passes it. */
  flight: 0.9,
  /** The beam rises through the cube. */
  beamFrom: 0.55,
  beamTo: 1.75,
  /** The landing glow fades. */
  flash: 0.35,
  end: 2.1,
} as const;

type Scatter = { x: number; y: number; z: number; size: number; axis: Vector3; angle: number };

/** Seeded pseudo-random numbers (mulberry32), so every load scatters the blocks the same way. */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Where each block waits: x and y as shares of the box's half-size (farther blocks sit nearer its centre,
 * as with a vanishing point), z behind the shape, its size as a share of its size in the shape, and a small
 * tumble that untwists as it lands.
 */
const SCATTER: Scatter[] = (() => {
  const next = random(7);
  return Array.from({ length: BLOCKS }, () => {
    const depth = next();
    const direction = next() * 2 * Math.PI;
    const reach = Math.sqrt(next()) * (1 - 0.55 * depth);
    return {
      x: Math.cos(direction) * reach,
      y: Math.sin(direction) * reach,
      z: -2 - 4 * depth,
      size: 0.2 - 0.12 * depth,
      axis: new Vector3(next() - 0.5, next() - 0.5, next() - 0.5).normalize(),
      angle: next() - 0.5,
    };
  });
})();

const tumbleQ = new Quaternion();

/** The intro beam at `time`: its height between `low` and `high` (page units), and its opacity. */
export function introBeam(time: number, low: number, high: number): { y: number; opacity: number } {
  const t = MathUtils.clamp((time - INTRO.beamFrom) / (INTRO.beamTo - INTRO.beamFrom), 0, 1);
  const opacity =
    MathUtils.smoothstep(time, INTRO.beamFrom - 0.15, INTRO.beamFrom + 0.05) *
    (1 - MathUtils.smoothstep(time, INTRO.beamTo, INTRO.beamTo + 0.25));
  return { y: MathUtils.lerp(low, high, t), opacity };
}

/**
 * Writes `placed` (the hero cube's poses on the page) as they are `time` seconds into the intro into
 * `out`. Blocks wait scattered inside the box (centre x, y and half-size in page units), then each flies
 * to its slot, landing as the beam (rising from `low` to `high`) passes its centre.
 */
export function introPoses(
  placed: Pose[],
  out: Pose[],
  time: number,
  low: number,
  high: number,
  box: { x: number; y: number; halfWidth: number; halfHeight: number },
) {
  const appear = MathUtils.smoothstep(time, 0, INTRO.appear);
  for (let i = 0; i < BLOCKS; i++) {
    const to = placed[i];
    const pose = out[i];
    const seed = SCATTER[i];
    const across = MathUtils.clamp((to.position.y - low) / (high - low), 0, 1);
    const arrive = MathUtils.lerp(INTRO.beamFrom, INTRO.beamTo, across);
    const start = Math.max(0, arrive - INTRO.flight);
    // As if coming from far away: it stays small and distant for most of its flight and closes in as the
    // beam reaches it (size grows as 1 / depth), easing out so it still lands softly.
    const flown = 1 - (1 - MathUtils.clamp((time - start) / (arrive - start), 0, 1)) ** 2;
    const near = seed.size / (seed.size + (1 - seed.size) * (1 - flown));
    const e = (near - seed.size) / (1 - seed.size);
    pose.position.set(
      MathUtils.lerp(box.x + seed.x * box.halfWidth, to.position.x, e),
      MathUtils.lerp(box.y + seed.y * box.halfHeight, to.position.y, e),
      MathUtils.lerp(seed.z, to.position.z, e),
    );
    tumbleQ.setFromAxisAngle(seed.axis, seed.angle * (1 - e));
    pose.quaternion.multiplyQuaternions(tumbleQ, to.quaternion);
    pose.scale.copy(to.scale).multiplyScalar(MathUtils.lerp(seed.size * appear, 1, e));
    const since = time - arrive;
    pose.glow = since >= 0 ? Math.max(to.glow, FLASH_GLOW * Math.max(0, 1 - since / INTRO.flash)) : to.glow;
  }
}
