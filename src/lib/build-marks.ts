import { BUILD_SHAPES, DEFAULT_BLOCK, DEFAULT_VIEW, type ShapeKey, type Voxel } from "./build-shapes";

/*
 * "The Build" as flat SVG: each voxel shape (build-shapes.ts) drawn once, at rest, from the same view
 * angle and group turns the 3D chunk uses, so the header mark is the same model in miniature. Pure
 * geometry, no React and no WebGL. Only runs at build time (the sprite route) and in previews.
 *
 * Every exposed, front-facing block face becomes a polygon in one of three tones (by how it faces the
 * light) or the accent ("lit": lenses and screens). Faces are ordered back to front wherever they overlap,
 * then same-tone runs are merged, so a shape is a handful of paths.
 */

type Vec3 = [number, number, number];
type Point = [number, number];

export type MarkTone = "light" | "mid" | "dark" | "lit";
export type MarkPath = { tone: MarkTone; d: string };

type Face = { tone: MarkTone; points: Point[]; normal: Vec3; origin: Vec3; area: number };

// Light from the upper left, slightly towards the viewer, like the 3D material's.
const LIGHT: Vec3 = normalize([-0.35, 0.85, 0.4]);
const LIGHT_FROM = 0.72;
const MID_FROM = 0.3;

const SOLID_FROM = 0.85;

// Two faces that share no more than this much area (view units squared) don't overlap.
const OVERLAP = 1e-4;
// Where a face is sampled (across each edge) to tell whether nearer faces hide all of it.
const COVER_SAMPLES = [0.04, 0.27, 0.5, 0.73, 0.96];

function normalize([x, y, z]: Vec3): Vec3 {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

/** Rotation about an axis-aligned axis by `angle`. */
function turn([x, y, z]: Vec3, axis: "x" | "y" | "z", angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  if (axis === "x") return [x, y * c - z * s, y * s + z * c];
  if (axis === "y") return [x * c + z * s, y, -x * s + z * c];
  return [x * c - y * s, x * s + y * c, z];
}

/** The view rotation: three.js Euler "XYZ" (roll about z first, then yaw about y, then pitch about x). */
function view(point: Vec3, pitch: number, yaw: number, roll: number): Vec3 {
  return turn(turn(turn(point, "z", roll), "y", yaw), "x", pitch);
}

const SIDES: { axis: 0 | 1 | 2; sign: 1 | -1 }[] = [
  { axis: 0, sign: 1 },
  { axis: 0, sign: -1 },
  { axis: 1, sign: 1 },
  { axis: 1, sign: -1 },
  { axis: 2, sign: 1 },
  { axis: 2, sign: -1 },
];

function signedArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/** The overlap of two convex counter-clockwise polygons (Sutherland–Hodgman). */
function clip(subject: Point[], clipper: Point[]): Point[] {
  let output = subject;
  for (let i = 0; i < clipper.length && output.length; i++) {
    const [ax, ay] = clipper[i];
    const [bx, by] = clipper[(i + 1) % clipper.length];
    const inside = ([x, y]: Point) => (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= 0;
    const cross = ([px, py]: Point, [qx, qy]: Point): Point => {
      const a1 = by - ay;
      const b1 = ax - bx;
      const a2 = qy - py;
      const b2 = px - qx;
      const det = a1 * b2 - a2 * b1;
      const c1 = a1 * ax + b1 * ay;
      const c2 = a2 * px + b2 * py;
      return [(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det];
    };
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const current = input[j];
      const previous = input[(j + input.length - 1) % input.length];
      if (inside(current)) {
        if (!inside(previous)) output.push(cross(previous, current));
        output.push(current);
      } else if (inside(previous)) {
        output.push(cross(previous, current));
      }
    }
  }
  return output;
}

/** Depth (view z, larger is nearer) of a face's plane at a point. */
function depthAt(face: Face, [x, y]: Point): number {
  const [nx, ny, nz] = face.normal;
  const [ox, oy, oz] = face.origin;
  return oz - (nx * (x - ox) + ny * (y - oy)) / nz;
}

function shapeFaces(key: ShapeKey): Face[] {
  const shape = BUILD_SHAPES[key];
  const pitch = shape.view?.pitch ?? DEFAULT_VIEW.pitch;
  const yaw = shape.view?.yaw ?? DEFAULT_VIEW.yaw;
  const roll = shape.view?.roll ?? DEFAULT_VIEW.roll;
  const faces: Face[] = [];

  for (const group of shape.groups) {
    // Near-full blocks close up: at icon size the 3D model's hairline gaps only read as noise. Thin and
    // wide pieces (tiles, pages, lenses) keep their size, and the cube keeps its seams: it is the
    // "systems from parts" mark.
    const solid = (share: number) => key !== "cube" && share >= SOLID_FROM && share < 1;
    const size = (group.block ?? shape.block ?? DEFAULT_BLOCK).map((share) => (solid(share) ? 1 : share));
    const filled = new Set(group.voxels.map((voxel) => voxel.join(",")));
    // An empty cell walled in on all six sides (the cube's hidden centre) is never seen.
    const enclosed = (cell: Vec3) =>
      SIDES.every(({ axis, sign }) => {
        const wall = [...cell] as Vec3;
        wall[axis] += sign;
        return filled.has(wall.join(","));
      });
    const pivot: Voxel = group.turn?.pivot ?? [0, 0, 0];
    const place = (point: Vec3): Vec3 => {
      const local: Vec3 = [point[0] - pivot[0], point[1] - pivot[1], point[2] - pivot[2]];
      const turned = group.turn ? turn(local, group.turn.axis, group.turn.angle) : local;
      return view([turned[0] + pivot[0], turned[1] + pivot[1], turned[2] + pivot[2]], pitch, yaw, roll);
    };

    for (const voxel of group.voxels) {
      for (const { axis, sign } of SIDES) {
        const neighbour = [...voxel] as Vec3;
        neighbour[axis] += sign;
        if (filled.has(neighbour.join(",")) || enclosed(neighbour)) continue;

        // The face's four corners, in the block's frame, wound counter-clockwise seen from outside.
        const u = ((axis + 1) % 3) as 0 | 1 | 2;
        const v = ((axis + 2) % 3) as 0 | 1 | 2;
        const corners = (
          [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ] as const
        ).map(([a, b]) => {
          const point = [...voxel] as Vec3;
          point[axis] += (sign * size[axis]) / 2;
          point[u] += (a * size[u]) / 2;
          point[v] += (b * size[v]) / 2;
          return place(point);
        });
        if (sign < 0) corners.reverse();

        const centre = place([...voxel] as Vec3);
        const outward = [...voxel] as Vec3;
        outward[axis] += sign;
        const tip = place(outward);
        const normal = normalize([tip[0] - centre[0], tip[1] - centre[1], tip[2] - centre[2]]);
        // Seen edge-on or from behind.
        if (normal[2] < 0.02) continue;

        const points = corners.map(([x, y]): Point => [x, y]);
        const light = normal[0] * LIGHT[0] + normal[1] * LIGHT[1] + normal[2] * LIGHT[2];
        let tone: MarkTone = light >= LIGHT_FROM ? "light" : light >= MID_FROM ? "mid" : "dark";
        if (group.live === "lens" || group.live === "screen") tone = "lit";
        faces.push({ tone, points, normal, origin: corners[0], area: signedArea(points) });
      }
    }
  }
  return faces;
}

/**
 * Back to front wherever faces overlap, keeping same-tone faces together where the order allows, so
 * they merge into few paths.
 */
function paintOrder(faces: Face[]): Face[] {
  const behind = faces.map(() => new Set<number>());
  const blocks = faces.map(() => [] as number[]);
  for (let a = 0; a < faces.length; a++) {
    for (let b = a + 1; b < faces.length; b++) {
      const overlap = clip(faces[a].points, faces[b].points);
      if (overlap.length < 3 || Math.abs(signedArea(overlap)) < OVERLAP) continue;
      const centre = overlap
        .reduce<Point>(([x, y], [px, py]) => [x + px, y + py], [0, 0])
        .map((sum) => sum / overlap.length) as Point;
      const [front, back] = depthAt(faces[a], centre) > depthAt(faces[b], centre) ? [a, b] : [b, a];
      behind[front].add(back);
      blocks[back].push(front);
    }
  }

  const ordered: Face[] = [];
  const done = new Set<number>();
  let tone: MarkTone | null = null;
  while (done.size < faces.length) {
    let pick = -1;
    for (let i = 0; i < faces.length; i++) {
      if (done.has(i) || behind[i].size) continue;
      if (pick === -1 || (faces[i].tone === tone && faces[pick].tone !== tone)) pick = i;
    }
    // A cycle (faces that each overlap the other in front): break it at the farthest face.
    if (pick === -1) {
      for (let i = 0; i < faces.length; i++) {
        if (done.has(i)) continue;
        if (pick === -1 || faces[i].origin[2] < faces[pick].origin[2]) pick = i;
      }
    }
    done.add(pick);
    tone = faces[pick].tone;
    for (const front of blocks[pick]) behind[front].delete(pick);
    if (!hidden(faces[pick], blocks[pick].map((front) => faces[front]))) ordered.push(faces[pick]);
  }
  return ordered;
}

function contains(polygon: Point[], [x, y]: Point): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const [ax, ay] = polygon[i];
    const [bx, by] = polygon[(i + 1) % polygon.length];
    if ((bx - ax) * (y - ay) - (by - ay) * (x - ax) < 0) return false;
  }
  return true;
}

/** True when nearer faces cover the whole of `face` (sampled on a grid), so it never shows. */
function hidden(face: Face, nearer: Face[]): boolean {
  if (!nearer.length) return false;
  const [a, b, , d] = face.points;
  for (const u of COVER_SAMPLES) {
    for (const v of COVER_SAMPLES) {
      const point: Point = [
        a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v,
        a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v,
      ];
      if (!nearer.some((front) => contains(front.points, point))) return false;
    }
  }
  return true;
}

/** A shape as paths in a `size`×`size` view box, `pad` clear on every side, coordinates to `digits` places. */
export function markPaths(key: ShapeKey, { size = 24, pad = 1, digits = 1 } = {}): MarkPath[] {
  const faces = paintOrder(shapeFaces(key));
  let left = Infinity;
  let right = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;
  for (const { points } of faces) {
    for (const [x, y] of points) {
      left = Math.min(left, x);
      right = Math.max(right, x);
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
  }
  const scale = (size - 2 * pad) / Math.max(right - left, top - bottom);
  const offsetX = size / 2 - ((left + right) / 2) * scale;
  const offsetY = size / 2 + ((bottom + top) / 2) * scale;
  const unit = 10 ** digits;
  const round = (n: number) => Math.round(n * unit) / unit;
  // Shortest form: no leading zero, and a minus sign doubles as the separator.
  const format = (n: number) => String(round(n)).replace(/^(-?)0\./, "$1.");
  const pair = (x: number, y: number) => `${format(x)}${y < 0 ? "" : " "}${format(y)}`;

  const paths: MarkPath[] = [];
  for (const face of faces) {
    // Rounded first, so the relative steps add up exactly.
    const points = face.points.map(([x, y]) => [round(offsetX + x * scale), round(offsetY - y * scale)]);
    const steps = points.slice(1).map(([x, y], i) => pair(x - points[i][0], y - points[i][1]));
    const d = `M${pair(points[0][0], points[0][1])}l${steps.reduce((all, step) => all + (step.startsWith("-") ? "" : " ") + step)}z`;
    const last = paths.at(-1);
    if (last?.tone === face.tone) last.d += d;
    else paths.push({ tone: face.tone, d });
  }
  return paths;
}
