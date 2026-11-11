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
 * "The Build": turns the voxel shapes (src/lib/build-shapes.ts) into one pose per block, and streams them
 * into and out of their box. Positions are in companion units, centred on the shape; scales multiply the
 * 0.6 block geometry. placePoses then moves a set of poses to its spot on the page. Only imported by lazy
 * 3D code.
 */

/**
 * One block: where it is, and its look (build-material.ts): glow, and for portrait blocks their shade, how
 * far they wear the portrait's look and their opacity. Section shapes only ever set glow.
 */
export type Pose = {
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
  glow: number;
  shade: number;
  portrait: number;
  opacity: number;
};

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
function measure(shape: Omit<CompiledShape, "centre" | "width" | "height">, views: Quaternion[], withLive: boolean): Bounds {
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
  };
}

const SHAPES = Object.fromEntries(
  (Object.keys(BUILD_SHAPES) as ShapeKey[]).map((key) => [key, compile(key)]),
) as Record<ShapeKey, CompiledShape>;

/** On-screen size of a shape (live actions and sway included), companion units, for fitting it into a box. */
export function shapeSize(key: ShapeKey): { width: number; height: number } {
  return SHAPES[key];
}

export function createPoses(length = BLOCKS): Pose[] {
  return Array.from({ length }, () => ({
    position: new Vector3(),
    quaternion: new Quaternion(),
    scale: new Vector3(1, 1, 1),
    glow: 0,
    shade: 0,
    portrait: 0,
    opacity: 1,
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

/** Blocks start their move apart (spread over STAGGER of the transition), so a shape streams in parts. */
const STAGGER = 0.5;
/** A block's size at the far end of its trip, as a share of its size in the shape. */
const STREAM_SCALE = 0.85;

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t ** 3;

/**
 * Writes `placed` (a shape's poses, already on the page) streaming into `out`. "in": at `t` = 0 every block
 * waits just above `top`, and at 1 the shape is assembled; "out": at 0 it is assembled, and at 1 every
 * block has fallen just below `bottom`. Each block travels only as far as it needs to clear that edge, so it
 * is in view for its whole trip. Bottom blocks go first both ways (assembly order), with a soft landing in
 * and a gentle start out. `top` and `bottom` are the band's edges in page units (+y up).
 */
export function streamPoses(
  key: ShapeKey,
  placed: Pose[],
  out: Pose[],
  t: number,
  direction: "in" | "out",
  top: number,
  bottom: number,
) {
  const count = Math.max(1, SHAPES[key].blocks.length);
  for (let i = 0; i < BLOCKS; i++) {
    const from = placed[i];
    const to = out[i];
    const start = count > 1 ? (STAGGER * Math.min(i, count - 1)) / (count - 1) : 0;
    const local = MathUtils.clamp((t - start) / (1 - STAGGER), 0, 1);
    // 0 = in the shape, 1 = just past the band's edge.
    const away = direction === "in" ? 1 - easeOut(local) : easeIn(local);
    const radius = 0.5 * BLOCK * from.scale.length();
    const edge = direction === "in" ? top + radius : bottom - radius;
    to.position.copy(from.position);
    to.position.y = MathUtils.lerp(from.position.y, edge, away);
    to.quaternion.copy(from.quaternion);
    to.scale.copy(from.scale).multiplyScalar(MathUtils.lerp(1, STREAM_SCALE, away));
    to.glow = from.glow * (1 - away);
  }
}
