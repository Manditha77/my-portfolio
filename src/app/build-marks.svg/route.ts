import { BLOCK_HALF, GROWTH_UNIT } from "@/lib/boot-growth";
import { blockPaths, markPaths } from "@/lib/build-marks";
import { BUILD_SHAPES, type ShapeKey } from "@/lib/build-shapes";

/*
 * The header mark's sprite: every Build shape as a <symbol>, drawn from the same voxel data as the 3D
 * companion (src/lib/build-marks.ts). Prerendered at build time, so it is one small cached file and no
 * client JS. Faces are filled from the --mark-* tokens, which the page passes down into <use>.
 * It also holds the hero poster's cube block ("cube-block"; the poster places 27 of them) and its accent
 * flash ("cube-flash", the same silhouette), at the poster's frame and the 3D blocks' exact size and angle
 * (src/components/three/hero-poster.tsx): kept out of the page's HTML, and its copy in the RSC payload, so
 * the document stays small (LCP). The cube boot's detaching blocks reuse "cube-block".
 */

function symbol(key: ShapeKey): string {
  const paths = markPaths(key)
    .map(({ tone, d }) => `<path d="${d}" style="fill:var(--mark-${tone});stroke:var(--mark-${tone})"/>`)
    .join("");
  // A hairline stroke in each face's own colour closes the antialiasing seams between neighbours.
  return `<symbol id="${key}" viewBox="0 0 24 24"><g stroke-width=".15" stroke-linejoin="round">${paths}</g></symbol>`;
}

/** One poster block: faces from the --cube-* tokens, accent edges like the 3D blocks'; and its flash. */
function posterBlock(): string {
  const paths = blockPaths("cube", { unit: GROWTH_UNIT, digits: 1 });
  const box = `${-BLOCK_HALF} ${-BLOCK_HALF} ${2 * BLOCK_HALF} ${2 * BLOCK_HALF}`;
  const faces = paths.map(({ tone, d }) => `<path d="${d}" style="fill:var(--cube-${tone})"/>`).join("");
  const flash = paths.map(({ d }) => `<path d="${d}"/>`).join("");
  return (
    `<symbol id="cube-block" viewBox="${box}"><g style="stroke:var(--accent)" stroke-width="2.25" stroke-linejoin="round">${faces}</g></symbol>` +
    `<symbol id="cube-flash" viewBox="${box}"><g style="fill:var(--accent);stroke:var(--accent)" stroke-width="2.25" stroke-linejoin="round">${flash}</g></symbol>`
  );
}

export function GET() {
  const symbols = (Object.keys(BUILD_SHAPES) as ShapeKey[]).map(symbol).join("") + posterBlock();
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
