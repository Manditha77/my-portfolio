import { brand } from "@/lib/brand";
import { cubeGeometry } from "@/lib/cube";

/*
 * The cube motif as plain SVG with literal colours, for ImageResponse (share images, app icons).
 * Not for the page itself: use HeroPoster there, which follows the theme tokens.
 */

type CubeMarkProps = {
  size: number;
  /** Stroke width of the outer cube in px; the inner cube and spokes scale from it. */
  stroke: number;
  /** Small icons drop the spokes and vertex dots so the mark stays legible. */
  detail?: "full" | "simple";
};

const VIEW = 100;

export function CubeMark({ size, stroke, detail = "full" }: CubeMarkProps) {
  const { outerPath, innerPath, spokesPath, outerPoints } = cubeGeometry({ view: VIEW, scale: 30 });
  // Stroke widths are given in output px, so convert them into viewBox units.
  const unit = VIEW / size;
  const full = detail === "full";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <g fill="none" stroke={brand.accent} strokeLinecap="round" strokeLinejoin="round">
        {full && <path d={spokesPath} strokeWidth={stroke * 0.55 * unit} strokeOpacity={0.35} />}
        <path d={innerPath} strokeWidth={stroke * 0.7 * unit} strokeOpacity={full ? 0.6 : 0.75} />
        <path d={outerPath} strokeWidth={stroke * unit} />
      </g>
      {full &&
        outerPoints.map(({ key, point: [cx, cy] }) => (
          <circle key={key} cx={cx} cy={cy} r={stroke * 2 * unit} fill={brand.accent} />
        ))}
    </svg>
  );
}
