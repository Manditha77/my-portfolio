import { BLOCK_HALF, DETACH_FROM } from "@/lib/boot-growth";
import { cx } from "@/lib/cx";

type BootBlockProps = {
  /** Where it lands: the header mark, the status dot, or "View my work". */
  target: keyof typeof DETACH_FROM;
  className?: string;
};

/**
 * One of the three blocks that detach from the hero cube as it glides into place in the cube boot
 * (src/lib/boot.ts): the poster's own block (the sprite's "cube-block"), flying from its spot on the cube,
 * at that block's size, into `target`, where it becomes the part that appears there. Shown only while the
 * boot plays (globals.css, "Cube boot"); its start is measured before first paint (bootMeasureScript,
 * from data-u/v/s). Decorative.
 */
export function BootBlock({ target, className }: BootBlockProps) {
  const { u, v, s } = DETACH_FROM[target];
  const size = 2 * BLOCK_HALF;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`${-BLOCK_HALF} ${-BLOCK_HALF} ${size} ${size}`}
      data-boot-block={target}
      data-u={u.toFixed(4)}
      data-v={v.toFixed(4)}
      data-s={s.toFixed(4)}
      className={cx("boot-block", className)}
    >
      <use href="/build-marks.svg#cube-block" x={-BLOCK_HALF} y={-BLOCK_HALF} width={size} height={size} />
    </svg>
  );
}
