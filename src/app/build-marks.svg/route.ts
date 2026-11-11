import { markPaths } from "@/lib/build-marks";
import { BUILD_SHAPES, type ShapeKey } from "@/lib/build-shapes";

/*
 * The header mark's sprite: every Build shape as a <symbol>, drawn from the same voxel data as the 3D
 * companion (src/lib/build-marks.ts). Prerendered at build time, so it is one small cached file and no
 * client JS. Faces are filled from the --mark-* tokens, which the page passes down into <use>.
 */

function symbol(key: ShapeKey): string {
  const paths = markPaths(key)
    .map(({ tone, d }) => `<path d="${d}" style="fill:var(--mark-${tone});stroke:var(--mark-${tone})"/>`)
    .join("");
  // A hairline stroke in each face's own colour closes the antialiasing seams between neighbours.
  return `<symbol id="${key}" viewBox="0 0 24 24"><g stroke-width=".15" stroke-linejoin="round">${paths}</g></symbol>`;
}

export function GET() {
  const symbols = (Object.keys(BUILD_SHAPES) as ShapeKey[]).map(symbol).join("");
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
