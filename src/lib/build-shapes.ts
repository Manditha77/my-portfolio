/*
 * "The Build": the voxel shape each home section's blocks assemble into (CLAUDE.md §6). Pure data on an
 * integer grid: x right, y up, z towards the viewer. Shapes are low-resolution on purpose, so they read at a
 * glance as small block models. The 3D chunk centres and scales each one (build-poses.ts); blocks a shape
 * doesn't use tuck into its centre.
 */

/** The hero poster's yaw (src/lib/cube.ts). */
const YAW = 0.6;

export type Voxel = readonly [x: number, y: number, z: number];

/** A set of voxels, optionally turned as one piece about a pivot (an open book's pages, a waving arm). */
export type VoxelGroup = {
  voxels: readonly Voxel[];
  turn?: { pivot: Voxel; axis: "x" | "y" | "z"; angle: number };
  /** The group that waves once when the shape completes (About). */
  wave?: boolean;
  /** Offset the group hovers at while the shape assembles; it settles into place as the shape completes. */
  place?: Voxel;
};

export type BuildShape = {
  groups: readonly VoxelGroup[];
  /** Viewing angle, radians. Defaults to the hero poster's (src/lib/cube.ts). */
  view?: { pitch: number; yaw: number; roll?: number };
  /** Voxel spacing in companion units. Defaults to fitting the largest extent into SHAPE_SIZE. */
  step?: number;
  /** Block size per axis as a share of the spacing (default 0.9 on every axis). */
  block?: readonly [number, number, number];
};

export type ShapeKey = "cube" | "stack" | "headset" | "plane" | "book" | "tiles" | "person" | "envelope";

/** Instance count: at least the largest shape's voxel count. */
export const BUILD_BLOCKS = 100;

/** Largest extent of a shape in companion units (the hero cube is 2 units across). */
export const SHAPE_SIZE = 2.4;

/** Every voxel in the inclusive box x0..x1 × y0..y1 × z0..z1. */
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Voxel[] {
  const voxels: Voxel[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) voxels.push([x, y, z]);
    }
  }
  return voxels;
}

/** A front view drawn as rows of text (top row first, "#" = block), extruded through z0..z1. */
function art(rows: readonly string[], z0 = 0, z1 = z0): Voxel[] {
  const voxels: Voxel[] = [];
  rows.forEach((row, i) => {
    const y = rows.length - 1 - i;
    [...row].forEach((cell, x) => {
      if (cell === "#") for (let z = z0; z <= z1; z++) voxels.push([x, y, z]);
    });
  });
  return voxels;
}

/** A square slab seen from above, without its four corners. */
function roundSlab(size: number, y0: number, y1: number): Voxel[] {
  const last = size - 1;
  return box(0, last, y0, y1, 0, last).filter(([x, , z]) => !((x === 0 || x === last) && (z === 0 || z === last)));
}

export const BUILD_SHAPES: Readonly<Record<ShapeKey, BuildShape>> = {
  // Hero and the start: the poster's 3×3×3 cube without its hidden centre, at its exact spacing.
  cube: {
    groups: [{ voxels: box(-1, 1, -1, 1, -1, 1).filter(([x, y, z]) => x || y || z) }],
    step: 0.667,
  },

  // Work: full stack. Database (two blocks thick), API and UI layers, with a gap between each.
  stack: {
    groups: [{ voxels: [...roundSlab(5, 0, 1), ...roundSlab(5, 4, 4), ...roundSlab(5, 7, 7)] }],
    view: { pitch: 0.35, yaw: YAW },
  },

  // VR / AR: a headset seen three-quarter front. A visor two blocks deep (front at z = 1) with two lens
  // openings, rounded corners and a nose notch; a strap loop round the back and a strap over the top.
  headset: {
    groups: [
      {
        voxels: [
          ...art([".######.", "#..##..#", "#..##..#", "###..###"], 0, 1),
          ...box(0, 0, 2, 2, -4, -1),
          ...box(7, 7, 2, 2, -4, -1),
          ...box(0, 7, 2, 2, -5, -5),
          ...box(3, 4, 3, 3, -5, -1),
        ],
      },
    ],
    view: { pitch: 0.2, yaw: 0.52 },
  },

  // Experience: an aeroplane (the airline system), nose towards +x, swept wings, tailplane and fin.
  plane: {
    groups: [
      {
        voxels: [
          ...box(-5, 4, 0, 1, 0, 0),
          [5, 0, 0],
          ...[1, 2, 3, 4, 5].flatMap((span) => {
            const x = 1 - Math.floor(span / 2);
            return [...box(x - 1, x, 0, 0, span, span), ...box(x - 1, x, 0, 0, -span, -span)];
          }),
          ...box(-5, -5, 0, 0, -2, -1),
          ...box(-5, -5, 0, 0, 1, 2),
          ...box(-5, -5, 2, 3, 0, 0),
          ...box(-4, -4, 2, 2, 0, 0),
        ],
      },
    ],
    view: { pitch: 0.6, yaw: -0.45, roll: 0.15 },
  },

  // Writing: an open book lying flat. Each side is a cover with a slightly narrower block of pages on it,
  // lifted either side of the spine.
  book: {
    groups: [
      { voxels: box(0, 0, 0, 0, -2, 2) },
      {
        voxels: [...box(-5, -1, 0, 0, -2, 2), ...box(-4, -1, 1, 1, -2, 2)],
        turn: { pivot: [-0.5, 0, 0], axis: "z", angle: -0.38 },
      },
      {
        voxels: [...box(1, 5, 0, 0, -2, 2), ...box(1, 4, 1, 1, -2, 2)],
        turn: { pivot: [0.5, 0, 0], axis: "z", angle: 0.38 },
      },
    ],
    view: { pitch: 0.55, yaw: 0.2 },
  },

  // Skills: a 5×5 board of thin tiles tilted back. The last tile hovers above its empty slot and settles
  // into it as the shape completes.
  tiles: {
    groups: [
      { voxels: box(-2, 2, -2, 2, 0, 0).filter(([x, y]) => !(x === 1 && y === 2)) },
      { voxels: [[1, 2, 0]], place: [0, 0, 1.6] },
    ],
    view: { pitch: -0.55, yaw: 0.3 },
    step: 0.48,
    block: [0.83, 0.83, 0.17],
  },

  // About: a small blocky person, right arm raised (it waves once).
  person: {
    groups: [
      {
        voxels: [
          ...box(-1, -1, 0, 2, 0, 1),
          ...box(1, 1, 0, 2, 0, 1),
          ...box(-1, 1, 3, 6, 0, 1),
          ...box(-2, -2, 3, 6, 0, 0),
          ...box(0, 0, 7, 7, 0, 1),
          ...box(-1, 1, 8, 10, 0, 1),
        ],
      },
      { voxels: box(2, 2, 6, 9, 0, 0), turn: { pivot: [2, 6, 0], axis: "z", angle: -0.25 }, wave: true },
    ],
    view: { pitch: 0.25, yaw: 0.45 },
  },

  // Contact: an envelope. The closed flap is two diagonal lines of gaps from the top corners, meeting in the
  // middle. Each step overlaps the next by one cell, so the lines read as unbroken.
  envelope: {
    groups: [
      {
        voxels: art([
          "..#######..",
          "#..#####..#",
          "##..###..##",
          "###..#..###",
          "####...####",
          "###########",
          "###########",
        ]),
      },
    ],
    view: { pitch: 0.12, yaw: 0.15 },
  },
};
