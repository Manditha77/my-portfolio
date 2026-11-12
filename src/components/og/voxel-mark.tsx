import { brand } from "@/lib/brand";
import { markPaths, type MarkTone } from "@/lib/build-marks";
import type { ShapeKey } from "@/lib/build-shapes";

/*
 * A Build shape as the header mark draws it (src/lib/build-marks.ts), with literal colours, for
 * ImageResponse (share images, app icons). Not for the page itself: the header uses the themed sprite.
 */

const VIEW = 24;

export const markFill: Record<MarkTone, string> = {
  light: brand.markLight,
  mid: brand.markMid,
  dark: brand.markDark,
  lit: brand.markLit,
};

type VoxelMarkProps = {
  size: number;
  shape?: ShapeKey;
};

export function VoxelMark({ size, shape = "cube" }: VoxelMarkProps) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      {/* A hairline stroke in each face's own colour closes the antialiasing seams, as in the sprite. */}
      {markPaths(shape, { size: VIEW, pad: 0.25 }).map(({ tone, d }, index) => (
        <path key={index} d={d} fill={markFill[tone]} stroke={markFill[tone]} strokeWidth={0.15} strokeLinejoin="round" />
      ))}
    </svg>
  );
}
