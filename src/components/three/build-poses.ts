import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import { BUILD_BLOCKS, BUILD_SHAPES, SHAPE_SIZE, type ShapeKey } from "@/lib/build-shapes";

/*
 * "The Build": turns the voxel shapes (src/lib/build-shapes.ts) into one pose per block, and blends
 * between them. Positions are in companion units, centred on the companion's box; scales multiply the
 * 0.6 block geometry. Only imported by lazy 3D code.
 */

export type Pose = { position: Vector3; quaternion: Quaternion; scale: Vector3 };

export type PoseInput = {
  /** Hero only: spin and pointer tilt (radians) and separation (0 = assembled, 1 = fully apart). */
  spin: number;
  tiltX: number;
  tiltY: number;
  separation: number;
  /** About only: extra turn of the waving arm, radians. */
  wave: number;
  /** 0 = placed groups hover at their offset, 1 = settled into the shape. */
  settle: number;
};

export const REST: PoseInput = { spin: 0, tiltX: 0, tiltY: 0, separation: 0, wave: 0, settle: 1 };

export const BLOCKS = BUILD_BLOCKS;
/** Edge length of the block geometry, companion units. */
export const BLOCK = 0.6;

// Must match the poster's projection (src/lib/cube.ts): shapes default to its exact orientation.
const YAW = 0.6;
const PITCH = 0.45;

const FILL = 0.9;
// Kept small so a fully separated hero cube's diagonal still fits inside its box.
const SPREAD = 0.25;

type CompiledBlock = { local: Vector3; pivot: Vector3; group: number };

type CompiledShape = {
  blocks: CompiledBlock[];
  turns: { axis: Vector3; angle: number; wave: boolean; place: Vector3 | null }[];
  pitch: number;
  yaw: number;
  roll: number;
  step: number;
  blockScale: Vector3;
  /** Centre of the shape's on-screen box, in view space at rest. */
  centre: Vector3;
  /** On-screen size at rest, companion units (blocks included). */
  width: number;
  height: number;
};

const AXES = { x: new Vector3(1, 0, 0), y: new Vector3(0, 1, 0), z: new Vector3(0, 0, 1) } as const;

const euler = new Euler();
const viewQ = new Quaternion();
const turnQ = new Quaternion();
const point = new Vector3();

function compile(key: ShapeKey): CompiledShape {
  const shape = BUILD_SHAPES[key];
  const blocks: CompiledBlock[] = [];
  const turns = shape.groups.map((group) => ({
    axis: AXES[group.turn?.axis ?? "z"],
    angle: group.turn?.angle ?? 0,
    wave: group.wave === true,
    place: group.place ? new Vector3(...group.place) : null,
  }));
  shape.groups.forEach((group, index) => {
    const pivot = new Vector3(...(group.turn?.pivot ?? [0, 0, 0]));
    for (const voxel of group.voxels) {
      blocks.push({ local: new Vector3(...voxel).sub(pivot), pivot, group: index });
    }
  });
  if (blocks.length > BLOCKS) throw new Error(`Build shape "${key}" has more than ${BLOCKS} voxels`);
  // Assembly order: bottom to top, with placed groups last.
  const placed = (block: CompiledBlock) => (turns[block.group].place ? 1 : 0);
  blocks.sort(
    (a, b) =>
      placed(a) - placed(b) ||
      a.local.y + a.pivot.y - (b.local.y + b.pivot.y) ||
      a.local.x + a.pivot.x - (b.local.x + b.pivot.x),
  );

  const pitch = shape.view?.pitch ?? PITCH;
  const yaw = shape.view?.yaw ?? YAW;
  const roll = shape.view?.roll ?? 0;
  const fill = shape.block ?? [FILL, FILL, FILL];

  // Voxel positions with their groups turned, then the largest extent fitted into SHAPE_SIZE.
  const turned = blocks.map(({ local, pivot, group }) =>
    local.clone().applyAxisAngle(turns[group].axis, turns[group].angle).add(pivot),
  );
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  turned.forEach((p) => {
    min.min(p);
    max.max(p);
  });
  const extent = Math.max(max.x - min.x, max.y - min.y, max.z - min.z) + 1;
  const step = shape.step ?? SHAPE_SIZE / extent;

  // On-screen box: block centres in view space, settled and (for placed groups) hovering, plus each
  // block's half-diagonal. The shape stays inside it at every stage.
  const hovering = blocks.flatMap(({ group }, i) => {
    const place = turns[group].place;
    return place ? [turned[i].clone().add(place)] : [];
  });
  viewQ.setFromEuler(euler.set(pitch, yaw, roll));
  const radius = 0.5 * step * Math.hypot(...fill);
  let left = Infinity;
  let right = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;
  [...turned, ...hovering].forEach((p) => {
    point.copy(p).multiplyScalar(step).applyQuaternion(viewQ);
    left = Math.min(left, point.x);
    right = Math.max(right, point.x);
    bottom = Math.min(bottom, point.y);
    top = Math.max(top, point.y);
  });

  return {
    blocks,
    turns,
    pitch,
    yaw,
    roll,
    step,
    blockScale: new Vector3(...fill).multiplyScalar(step / BLOCK),
    centre: new Vector3((left + right) / 2, (bottom + top) / 2, 0),
    width: right - left + 2 * radius,
    height: top - bottom + 2 * radius,
  };
}

const SHAPES = Object.fromEntries(
  (Object.keys(BUILD_SHAPES) as ShapeKey[]).map((key) => [key, compile(key)]),
) as Record<ShapeKey, CompiledShape>;

/** On-screen size of a shape at rest, companion units, for fitting it into a box. */
export function shapeSize(key: ShapeKey): { width: number; height: number } {
  return SHAPES[key];
}

export function createPoses(): Pose[] {
  return Array.from({ length: BLOCKS }, () => ({
    position: new Vector3(),
    quaternion: new Quaternion(),
    scale: new Vector3(1, 1, 1),
  }));
}

/** Writes one pose per block for `key` into `out`; blocks the shape doesn't use tuck into its centre. */
export function fillShape(key: ShapeKey, out: Pose[], input: PoseInput) {
  const shape = SHAPES[key];
  viewQ.setFromEuler(euler.set(shape.pitch + input.tiltX, shape.yaw + input.spin + input.tiltY, shape.roll));
  const spread = 1 + SPREAD * input.separation;
  const step = shape.step * spread;

  for (let i = 0; i < BLOCKS; i++) {
    const pose = out[i];
    const block = shape.blocks[i];
    if (!block) {
      pose.position.set(0, 0, 0);
      pose.quaternion.copy(viewQ);
      pose.scale.setScalar(0);
      continue;
    }
    const turn = shape.turns[block.group];
    turnQ.setFromAxisAngle(turn.axis, turn.angle + (turn.wave ? input.wave : 0));
    pose.position
      .copy(block.local)
      .applyQuaternion(turnQ)
      .add(block.pivot);
    if (turn.place) pose.position.addScaledVector(turn.place, 1 - input.settle);
    pose.position
      .multiplyScalar(step)
      .applyQuaternion(viewQ)
      .addScaledVector(shape.centre, -spread);
    pose.quaternion.multiplyQuaternions(viewQ, turnQ);
    pose.scale.copy(shape.blockScale);
  }
}

/** Blocks start their move a little apart (up to STAGGER of the transition), so a shape assembles in parts. */
const STAGGER = 0.35;

/** Writes the blend of `a` and `b` at `t` (0..1) into `out`, block by block in assembly order. */
export function blendPoses(a: Pose[], b: Pose[], t: number, out: Pose[]) {
  for (let i = 0; i < BLOCKS; i++) {
    const start = (STAGGER * i) / (BLOCKS - 1);
    const local = MathUtils.smoothstep(MathUtils.clamp((t - start) / (1 - STAGGER), 0, 1), 0, 1);
    out[i].position.lerpVectors(a[i].position, b[i].position, local);
    out[i].quaternion.slerpQuaternions(a[i].quaternion, b[i].quaternion, local);
    out[i].scale.lerpVectors(a[i].scale, b[i].scale, local);
  }
}
