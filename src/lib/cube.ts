/*
 * The site's cube motif: an orthographic projection of nested cubes (a tesseract-like wireframe).
 * Pure geometry, no React, so the hero poster, share images and icons can all draw the same mark.
 */

type Vec3 = readonly [number, number, number];
export type Point = readonly [number, number];

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

/** Indices of vertex pairs that differ in exactly one axis (the 12 cube edges). */
const CUBE_EDGES: [number, number][] = [];
for (let a = 0; a < 8; a++) {
  for (let b = a + 1; b < 8; b++) {
    const diff = a ^ b;
    if (diff === 1 || diff === 2 || diff === 4) CUBE_EDGES.push([a, b]);
  }
}

export type CubeGeometry = {
  outerPath: string;
  innerPath: string;
  spokesPath: string;
  outerPoints: { key: string; point: Point }[];
};

/**
 * Projects the nested cubes into a square `view`×`view` box, centred, where `scale` is the
 * outer cube's half-width in view units.
 */
export function cubeGeometry({ view, scale }: { view: number; scale: number }): CubeGeometry {
  const center = view / 2;

  /** Rotate around Y, then X, then project orthographically. */
  function project([x, y, z]: Vec3): Point {
    const rx = x * Math.cos(YAW) + z * Math.sin(YAW);
    const rz = -x * Math.sin(YAW) + z * Math.cos(YAW);
    const ry = y * Math.cos(PITCH) - rz * Math.sin(PITCH);
    return [center + rx * scale, center - ry * scale];
  }

  function segmentsPath(pairs: [Vec3, Vec3][]): string {
    return pairs
      .map(([from, to]) => {
        const [x1, y1] = project(from);
        const [x2, y2] = project(to);
        return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
      })
      .join("");
  }

  const outer = cubeVertices(1);
  const inner = cubeVertices(0.5);
  return {
    outerPath: segmentsPath(CUBE_EDGES.map(([a, b]) => [outer[a], outer[b]])),
    innerPath: segmentsPath(CUBE_EDGES.map(([a, b]) => [inner[a], inner[b]])),
    spokesPath: segmentsPath(outer.map((vertex, i) => [vertex, inner[i]])),
    outerPoints: outer.map((vertex) => ({ key: vertex.join(","), point: project(vertex) })),
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
