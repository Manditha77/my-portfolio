import { layerPaths, markPaths } from "@/lib/build-marks";
import { BUILD_SHAPES, type ShapeKey } from "@/lib/build-shapes";
import { POSTER } from "@/lib/cube";

/*
 * The header mark's sprite: every Build shape as a <symbol>, drawn from the same voxel data as the 3D
 * companion (src/lib/build-marks.ts). Prerendered at build time, so it is one small cached file and no
 * client JS. Faces are filled from the --mark-* tokens, which the page passes down into <use>.
 * It also holds the hero poster's solid cube, one <symbol> per voxel layer ("cube-0" is the bottom), at the
 * poster's frame and the 3D blocks' exact size and angle (src/components/three/hero-poster.tsx): kept out
 * of the page's HTML, and its copy in the RSC payload, so the document stays small (LCP).
 */

function symbol(key: ShapeKey): string {
  const paths = markPaths(key)
    .map(({ tone, d }) => `<path d="${d}" style="fill:var(--mark-${tone});stroke:var(--mark-${tone})"/>`)
    .join("");
  // A hairline stroke in each face's own colour closes the antialiasing seams between neighbours.
  return `<symbol id="${key}" viewBox="0 0 24 24"><g stroke-width=".15" stroke-linejoin="round">${paths}</g></symbol>`;
}

/** The poster cube's layers: faces from the --cube-* tokens, accent edges like the 3D blocks'. */
function posterLayers(): string {
  const layers = layerPaths("cube", {
    unit: POSTER.scale * (BUILD_SHAPES.cube.step ?? 1),
    center: POSTER.view / 2,
    digits: 0,
  });
  return layers
    .map((paths, layer) => {
      const faces = paths.map(({ tone, d }) => `<path d="${d}" style="fill:var(--cube-${tone})"/>`).join("");
      return `<symbol id="cube-${layer}" viewBox="0 0 ${POSTER.view} ${POSTER.view}"><g style="stroke:var(--accent)" stroke-width="2.25" stroke-linejoin="round">${faces}</g></symbol>`;
    })
    .join("");
}

export function GET() {
  const symbols = (Object.keys(BUILD_SHAPES) as ShapeKey[]).map(symbol).join("") + posterLayers();
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
