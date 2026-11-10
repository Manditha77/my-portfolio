import { Euler, MathUtils, Quaternion, Vector3 } from "three";

/*
 * "The Build": one target pose per block for each home section's layout. The hero cube's 26 blocks
 * rearrange between these as the page scrolls (PartsCube blends them). Positions are in companion
 * units, centred on the companion: the hero cube is about 2 units across. Scales multiply the 0.6 block.
 * Only imported by the lazy 3D chunk.
 */

export type LayoutKey = "cube" | "modules" | "ring" | "pipeline" | "grid" | "cluster" | "settled";

export type Pose = { position: Vector3; quaternion: Quaternion; scale: Vector3 };

export type LayoutInput = {
  /** Hero spin, radians. */
  spin: number;
  /** Pointer tilt, radians. */
  tiltX: number;
  tiltY: number;
  /** 0 = assembled, 1 = fully separated (pointer or idle breathing). */
  separation: number;
  /** Ring turn, radians (driven by scroll). */
  ringAngle: number;
  /** Seconds, for the About float. */
  time: number;
};

// Must match the poster's projection (src/lib/cube.ts): the cube starts on its exact orientation.
export const YAW = 0.6;
export const PITCH = 0.45;

const SPACING = 0.667;
// Kept small so a fully separated cube's diagonal still fits inside its box.
const SPREAD = 0.25;

/** The 3×3×3 cube without its hidden centre, in x, y, z loop order: x = -1 slab first. */
export const GRID: readonly (readonly [number, number, number])[] = (() => {
  const grid: [number, number, number][] = [];
  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) if (x || y || z) grid.push([x, y, z]);
    }
  }
  return grid;
})();

export const BLOCKS = GRID.length;

/** Width of each layout in units, so it can be scaled down to fit the free space beside the text. */
export const LAYOUT_WIDTH: Record<LayoutKey, number> = {
  cube: 2.6,
  modules: 2.8,
  ring: 3,
  pipeline: 3.8,
  grid: 2.6,
  cluster: 2,
  settled: 2.6,
};

export function createPoses(): Pose[] {
  return Array.from({ length: BLOCKS }, () => ({
    position: new Vector3(),
    quaternion: new Quaternion(),
    scale: new Vector3(1, 1, 1),
  }));
}

const euler = new Euler();
const iso = new Quaternion().setFromEuler(new Euler(PITCH, YAW, 0));
const tmpQ = new Quaternion();

/** Hero and Contact: the assembled cube. Rotating around Y then X, as the poster does. */
function cube(out: Pose[], { spin, tiltX, tiltY, separation }: LayoutInput) {
  const q = tmpQ.setFromEuler(euler.set(PITCH + tiltX, YAW + spin + tiltY, 0));
  const step = SPACING * (1 + SPREAD * separation);
  GRID.forEach(([x, y, z], i) => {
    out[i].position.set(x * step, y * step, z * step).applyQuaternion(q);
    out[i].quaternion.copy(q);
    out[i].scale.setScalar(1);
  });
}

/** Work: the cube's three horizontal layers, pulled apart with clear gaps and nudged sideways. */
function modules(out: Pose[]) {
  const gap = 0.35;
  GRID.forEach(([x, y, z], i) => {
    out[i].position.set(x * SPACING, y * (SPACING + gap), z * SPACING).applyQuaternion(iso);
    out[i].position.x += y * 0.18;
    out[i].quaternion.copy(iso);
    out[i].scale.setScalar(1);
  });
}

/** VR / AR: the AR game's ring reticle, facing the camera (inner radius ~0.8 of the outer). */
function ring(out: Pose[], { ringAngle }: LayoutInput) {
  const radius = 1.3;
  for (let i = 0; i < BLOCKS; i++) {
    const angle = (i / BLOCKS) * Math.PI * 2 + ringAngle;
    out[i].position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    // Each block follows the ring, with a little tilt so its faces still read as a block.
    out[i].quaternion.setFromEuler(euler.set(0.35, 0.35, angle));
    out[i].scale.setScalar(0.5);
  }
}

/** Experience: Sense (3×3 panel) → Analyze (2×2×2 cube) → Act (3×3 panel), in a row. */
function pipeline(out: Pose[]) {
  const step = 0.27;
  const groupX = 1.4;
  for (let i = 0; i < BLOCKS; i++) {
    const pose = out[i];
    if (i < 9 || i >= 17) {
      // The x = -1 and x = +1 slabs of the cube become the two flat panels.
      const local = i < 9 ? i : i - 17;
      const col = (local % 3) - 1;
      const row = Math.floor(local / 3) - 1;
      pose.position.set((i < 9 ? -groupX : groupX) + col * step, row * step, 0);
    } else {
      const local = i - 9;
      pose.position
        .set(((local & 1) - 0.5) * step, (((local >> 1) & 1) - 0.5) * step, ((local >> 2) - 0.5) * step)
        .applyQuaternion(iso);
    }
    pose.quaternion.copy(iso);
    pose.scale.setScalar(0.37);
  }
}

/** Writing + Skills: a 5×5 board of thin tiles tilted back, the 26th lifted over the centre tile. */
const board = new Quaternion().setFromEuler(new Euler(-0.55, 0.3, 0));
function grid(out: Pose[]) {
  const step = 0.48;
  for (let i = 0; i < BLOCKS; i++) {
    const pose = out[i];
    if (i < 25) pose.position.set(((i % 5) - 2) * step, (Math.floor(i / 5) - 2) * step, 0);
    else pose.position.set(0, 0, 0.28);
    pose.position.applyQuaternion(board);
    pose.quaternion.copy(board);
    pose.scale.set(0.4 / 0.6, 0.4 / 0.6, 0.08 / 0.6);
  }
}

/** Fixed pseudo-random offsets, so the About cluster looks the same on every visit. */
const CLUSTER = (() => {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return GRID.map(() => {
    const direction = new Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize();
    return {
      offset: direction.multiplyScalar(0.35 + random() * 0.5),
      period: 6 + random() * 3,
      phase: random() * Math.PI * 2,
      turn: (random() < 0.5 ? -1 : 1) * (0.08 + random() * 0.08),
    };
  });
})();

/** About: a small loose cluster; each block bobs and turns slowly. */
function cluster(out: Pose[], { time }: LayoutInput) {
  CLUSTER.forEach(({ offset, period, phase, turn }, i) => {
    const t = (time / period) * Math.PI * 2 + phase;
    out[i].position.copy(offset).setY(offset.y + Math.sin(t) * 0.04);
    out[i].quaternion.setFromEuler(euler.set(PITCH, YAW + turn * time, 0));
    out[i].scale.setScalar(0.5);
  });
}

export function fillLayout(key: LayoutKey, out: Pose[], input: LayoutInput) {
  switch (key) {
    case "cube":
      return cube(out, input);
    case "settled":
      // Contact: back in the poster's orientation and at rest.
      return cube(out, { ...input, spin: 0, tiltX: 0, tiltY: 0, separation: 0 });
    case "modules":
      return modules(out);
    case "ring":
      return ring(out, input);
    case "pipeline":
      return pipeline(out);
    case "grid":
      return grid(out);
    case "cluster":
      return cluster(out, input);
  }
}

/** Blocks start their move a little apart (up to STAGGER of the transition), so the shape assembles in parts. */
const STAGGER = 0.2;

/** Writes the blend of `a` and `b` at `t` (0..1) into `out`. */
export function blendPoses(a: Pose[], b: Pose[], t: number, out: Pose[]) {
  for (let i = 0; i < BLOCKS; i++) {
    const start = (STAGGER * i) / (BLOCKS - 1);
    const local = MathUtils.smoothstep(MathUtils.clamp((t - start) / (1 - STAGGER), 0, 1), 0, 1);
    out[i].position.lerpVectors(a[i].position, b[i].position, local);
    out[i].quaternion.slerpQuaternions(a[i].quaternion, b[i].quaternion, local);
    out[i].scale.lerpVectors(a[i].scale, b[i].scale, local);
  }
}
