import { Vector3 } from "three";
import type { LiveRole, ShapeKey } from "@/lib/build-shapes";

/*
 * "The Build": what a shape does while it is formed and on screen (CLAUDE.md §6). Groups with a live role
 * (build-shapes.ts) move on the shape's own clock, and every shape sways slowly so it always reads as 3D.
 * Offsets are in voxels in the group's own frame (before its turn); the caller scales everything by the
 * live weight, so a shape eases into and out of its actions. Only imported by lazy 3D code.
 */

export type LiveBlock = {
  /** Voxels, in the group's frame before its turn. */
  offset: Vector3;
  /** Extra turn about the group's axis, radians. */
  angle: number;
  /** 0..1 share of accent mixed into the block's faces. */
  glow: number;
};

export type Sway = { pitch: number; yaw: number; roll: number; bob: number };

/** Amplitudes: radians for the turns, companion units for the bob. */
const DEFAULT_SWAY: Sway = { pitch: 0.035, yaw: 0.07, roll: 0, bob: 0 };

export const SWAY: Readonly<Record<ShapeKey, Sway>> = {
  // The hero cube turns instead.
  cube: { pitch: 0, yaw: 0, roll: 0, bob: 0 },
  stack: DEFAULT_SWAY,
  // Looks around.
  headset: { pitch: 0.06, yaw: 0.22, roll: 0, bob: 0 },
  // Banks and bobs, as if flying.
  plane: { pitch: 0.035, yaw: 0.05, roll: 0.12, bob: 0.08 },
  book: DEFAULT_SWAY,
  // Yaw only: a pitch sway would make the tilted board taller, and Skills has a short band.
  tiles: { ...DEFAULT_SWAY, pitch: 0 },
  // Breathes.
  person: { ...DEFAULT_SWAY, bob: 0.04 },
  envelope: DEFAULT_SWAY,
};

// Periods, seconds. Unrelated lengths, so the sway never visibly repeats.
const YAW_PERIOD = 8;
const PITCH_PERIOD = 6.5;
const ROLL_PERIOD = 5;
const BOB_PERIOD = 3.2;

const wave = (time: number, period: number) => Math.sin((2 * Math.PI * time) / period);

/** The sway at `time` (seconds since the shape formed), at full amplitude. Zero at time 0. */
export function liveSway(amplitude: Sway, time: number, out: Sway): Sway {
  out.yaw = amplitude.yaw * wave(time, YAW_PERIOD);
  out.pitch = amplitude.pitch * wave(time, PITCH_PERIOD);
  out.roll = amplitude.roll * wave(time, ROLL_PERIOD);
  out.bob = amplitude.bob * wave(time, BOB_PERIOD);
  return out;
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Eases between keyframes ([seconds, value], times rising) and holds the ends. */
function track(time: number, keys: readonly (readonly [number, number])[]): number {
  if (time <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (time < t1) {
      const [t0, v0] = keys[i - 1];
      return v0 + (v1 - v0) * smooth((time - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}

// Stack: the request block steps UI → API → database → API → UI, pausing at each layer (PIPELINE).
const PACKET_PERIOD = 4.2;
const PACKET_KEYS = [
  [0.6, 0],
  [1.1, -3],
  [1.5, -3],
  [2, -6],
  [2.5, -6],
  [3, -3],
  [3.4, -3],
  [3.9, 0],
] as const;
const PACKET_GLOW = 0.55;

// Headset: the lenses pulse softly.
const LENS_PERIOD = 2.8;
const LENS_GLOW = 0.45;

// Person: the laptop's screen is simply on.
const SCREEN_GLOW = 0.7;

// Book: the sheet turns over, rests inside the left-hand pages, then rises back out of the right-hand ones.
const PAGE_PERIOD = 4.5;
const PAGE_TURN = [0.6, 1.8] as const;
const PAGE_RESET = [2.2, 2.7] as const;
const PAGE_SINK = -0.3; // voxels: just inside the pages

// Tiles: one tile at a time (a different one each cycle) lifts out of the board and settles back.
const LIFT_PERIOD = 3.2;
const LIFT_FROM = 0.4;
const LIFT_FOR = 1.2;
const LIFT_HEIGHT = 0.9; // voxels

// Person: a wave of two swings, fading out, every few seconds.
const WAVE_FIRST = 0.6;
const WAVE_PERIOD = 6;
const WAVE_FOR = 1.4;
const WAVE_ANGLE = 0.4;

// Envelope: the flap lifts, the letter peeks out over the top, then both settle.
const ENVELOPE_PERIOD = 5.5;
const FLAP_ANGLE = -0.45;
const FLAP_KEYS = [
  [0.6, 0],
  [1.3, FLAP_ANGLE],
  [3.4, FLAP_ANGLE],
  [4.1, 0],
] as const;
const LETTER_RISE = 2.4; // voxels
const LETTER_KEYS = [
  [1, 0],
  [1.8, LETTER_RISE],
  [2.8, LETTER_RISE],
  [3.5, 0],
] as const;

/**
 * Writes the live motion of one block into `out`: `member` is the block's index within its group of
 * `count`, `rest` the group's own turn (radians) and `time` the seconds since the shape formed.
 */
export function liveBlock(role: LiveRole, member: number, count: number, rest: number, time: number, out: LiveBlock) {
  out.offset.set(0, 0, 0);
  out.angle = 0;
  out.glow = 0;
  switch (role) {
    case "packet":
      out.offset.y = track(time % PACKET_PERIOD, PACKET_KEYS);
      out.glow = PACKET_GLOW;
      break;
    case "lens":
      out.glow = LENS_GLOW * (0.5 - 0.5 * Math.cos((2 * Math.PI * time) / LENS_PERIOD));
      break;
    case "screen":
      out.glow = SCREEN_GLOW;
      break;
    case "page": {
      const t = time % PAGE_PERIOD;
      if (t < PAGE_RESET[0]) {
        // Over the spine to the mirror of its resting turn.
        out.angle = (Math.PI - 2 * rest) * smooth((t - PAGE_TURN[0]) / (PAGE_TURN[1] - PAGE_TURN[0]));
      } else {
        out.offset.y = PAGE_SINK * (1 - smooth((t - PAGE_RESET[0]) / (PAGE_RESET[1] - PAGE_RESET[0])));
      }
      break;
    }
    case "lift": {
      const cycle = Math.floor(time / LIFT_PERIOD);
      if (member !== (cycle * 7 + 3) % count) break;
      const t = (time - cycle * LIFT_PERIOD - LIFT_FROM) / LIFT_FOR;
      if (t > 0 && t < 1) out.offset.z = LIFT_HEIGHT * Math.sin(Math.PI * t) ** 2;
      break;
    }
    case "wave": {
      if (time < WAVE_FIRST) break;
      const t = ((time - WAVE_FIRST) % WAVE_PERIOD) / WAVE_FOR;
      if (t < 1) out.angle = WAVE_ANGLE * Math.sin(t * Math.PI * 4) * (1 - t);
      break;
    }
    case "flap":
      out.angle = track(time % ENVELOPE_PERIOD, FLAP_KEYS);
      break;
    case "letter":
      out.offset.y = track(time % ENVELOPE_PERIOD, LETTER_KEYS);
      break;
  }
  return out;
}

export type LiveExtreme = { offset: readonly [number, number, number]; angle: number };

/** The furthest a role moves its blocks, so a shape's box leaves room for its actions. */
export function liveExtremes(role: LiveRole, rest: number): LiveExtreme[] {
  const at = (angle: number, y = 0, z = 0): LiveExtreme => ({ offset: [0, y, z], angle });
  switch (role) {
    case "packet":
      return [at(0, -3), at(0, -6)];
    case "page": {
      const turn = Math.PI - 2 * rest;
      return [at(0, PAGE_SINK), ...[0.2, 0.4, 0.5, 0.6, 0.8, 1].map((share) => at(turn * share))];
    }
    case "lift":
      return [at(0, 0, LIFT_HEIGHT)];
    case "wave":
      return [at(-WAVE_ANGLE), at(WAVE_ANGLE)];
    case "flap":
      return [at(FLAP_ANGLE)];
    case "letter":
      return [at(0, LETTER_RISE)];
    case "lens":
    case "screen":
      return [];
  }
}
