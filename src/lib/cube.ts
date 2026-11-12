/*
 * The hero cube's blueprint (an orthographic projection of its outer cube, at the poster's angle) and the
 * share images' grid. Pure geometry, no React.
 */

type Vec3 = readonly [number, number, number];
export type Point = readonly [number, number];

/**
 * The hero poster's frame: a `view`×`view` box with the outer cube `scale` view units from centre to face,
 * so the cube is 2 companion units across, as in the 3D companion.
 */
export const POSTER = { view: 400, scale: 100 } as const;

// View rotation (radians). Kept off the true isometric angle so no two vertices overlap.
const YAW = 0.6;
const PITCH = 0.45;

function cubeVertices(half: number): Vec3[] {
  const vertices: Vec3[] = [];
  for (const x of [-half, half]) {
    for (const y of [-half, half]) {
      for (const z of [-half, half]) vertices.push([x, y, z]);
    }
  }
  return vertices;
}

/** One straight line of the blueprint, as an SVG path ("M x1 y1 L x2 y2"). */
export type BlueprintLine = { key: string; d: string; back: boolean };

export type Blueprint = {
  /** The outer cube's 12 edges in drawing order: bottom ring, uprights, top ring. */
  edges: BlueprintLine[];
  /** The block lines on the three visible faces, at a third and two thirds across each. */
  grid: BlueprintLine[];
  /** Highest and lowest y of the outer cube, view units. */
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/**
 * The hero cube's blueprint: the outer cube (half-width `scale` view units, centred in a `view`×`view`
 * box) as single lines, so each can be traced on its own. The three hidden edges are marked `back`.
 */
export function blueprintGeometry({ view, scale }: { view: number; scale: number }): Blueprint {
  const center = view / 2;

  /** Rotate around Y, then X, then project orthographically; also returns depth (larger is nearer). */
  function project([x, y, z]: Vec3): { point: Point; depth: number } {
    const rx = x * Math.cos(YAW) + z * Math.sin(YAW);
    const rz = -x * Math.sin(YAW) + z * Math.cos(YAW);
    const ry = y * Math.cos(PITCH) - rz * Math.sin(PITCH);
    const depth = y * Math.sin(PITCH) + rz * Math.cos(PITCH);
    return { point: [center + rx * scale, center - ry * scale], depth };
  }

  const line = (from: Vec3, to: Vec3, back: boolean): BlueprintLine => {
    const [x1, y1] = project(from).point;
    const [x2, y2] = project(to).point;
    // Whole view units: a hairline's half-unit rounding never shows, and the markup stays small.
    const r = Math.round;
    return { key: `${from.join()}${to.join()}`, d: `M${r(x1)} ${r(y1)}L${r(x2)} ${r(y2)}`, back };
  };

  const vertices = cubeVertices(1);
  // The vertex farthest from the viewer: the three edges that meet there are hidden.
  const backIndex = vertices.reduce((best, vertex, i) => (project(vertex).depth < project(vertices[best]).depth ? i : best), 0);
  // Vertex index bits: x is 4, y is 2, z is 1 (see cubeVertices). Bottom ring, uprights, top ring, each
  // walked around the cube so the trace reads as one pen moving on.
  const yBit = 2;
  const ring = [0, 1, 5, 4];
  const order: [number, number][] = [
    ...ring.map((a, i): [number, number] => [a, ring[(i + 1) % 4]]),
    ...ring.map((a): [number, number] => [a, a | yBit]),
    ...ring.map((a, i): [number, number] => [a | yBit, ring[(i + 1) % 4] | yBit]),
  ];
  const edges = order.map(([a, b]) => line(vertices[a], vertices[b], a === backIndex || b === backIndex));

  // Visible faces: the three whose outward normal points towards the viewer.
  const grid: BlueprintLine[] = [];
  for (const axis of [0, 1, 2] as const) {
    for (const sign of [-1, 1] as const) {
      const normal: Vec3 = [axis === 0 ? sign : 0, axis === 1 ? sign : 0, axis === 2 ? sign : 0];
      if (project(normal).depth <= 0) continue;
      const u = (axis + 1) % 3;
      const v = (axis + 2) % 3;
      for (const [across, along] of [
        [u, v],
        [v, u],
      ]) {
        for (const at of [-1 / 3, 1 / 3]) {
          const from = [0, 0, 0] as [number, number, number];
          const to = [0, 0, 0] as [number, number, number];
          from[axis] = to[axis] = sign;
          from[across] = to[across] = at;
          from[along] = -1;
          to[along] = 1;
          grid.push(line(from, to, false));
        }
      }
    }
  }

  const points = vertices.map((vertex) => project(vertex).point);
  return {
    edges,
    grid,
    top: Math.min(...points.map(([, y]) => y)),
    bottom: Math.max(...points.map(([, y]) => y)),
    left: Math.min(...points.map(([x]) => x)),
    right: Math.max(...points.map(([x]) => x)),
  };
}

/** A square grid path (lines every `step` units) covering a `width`×`height` box. */
export function gridPath(width: number, height: number, step: number): string {
  const vertical = Array.from({ length: Math.ceil(width / step) - 1 }, (_, i) => (i + 1) * step)
    .map((x) => `M${x} 0V${height}`)
    .join("");
  const horizontal = Array.from({ length: Math.ceil(height / step) - 1 }, (_, i) => (i + 1) * step)
    .map((y) => `M0 ${y}H${width}`)
    .join("");
  return vertical + horizontal;
}
