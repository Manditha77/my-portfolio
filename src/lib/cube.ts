/*
 * The hero poster's frame and the share images' grid. Pure geometry, no React.
 */

/**
 * The hero poster's frame: a `view`×`view` box with the outer cube `scale` view units from centre to face,
 * so the cube is 2 companion units across, as in the 3D companion.
 */
export const POSTER = { view: 400, scale: 100 } as const;

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
