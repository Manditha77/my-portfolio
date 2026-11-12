import { markFill } from "@/components/og/voxel-mark";
import { brand } from "@/lib/brand";
import { markPaths } from "@/lib/build-marks";

export const contentType = "image/svg+xml";

const VIEW = 32;

/**
 * The favicon: the header mark's voxel cube on the dark tile, drawn from the same data as the header
 * sprite (src/lib/build-marks.ts), so the two can't drift. An SVG, prerendered at build time.
 */
export default function Icon() {
  const paths = markPaths("cube", { size: VIEW, pad: 3 })
    .map(({ tone, d }) => `<path d="${d}" fill="${markFill[tone]}" stroke="${markFill[tone]}"/>`)
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}">` +
    `<rect width="${VIEW}" height="${VIEW}" rx="7" fill="${brand.bg}"/>` +
    `<g stroke-width=".2" stroke-linejoin="round">${paths}</g></svg>`;
  return new Response(svg, { headers: { "Content-Type": contentType } });
}
