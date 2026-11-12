import { cubeGeometry } from "@/lib/cube";
import { cx } from "@/lib/cx";

/*
 * Static poster for the hero visual: the nested-cube motif (see lib/cube) in a soft accent glow, with a
 * second, flat glow just below it where it would meet the perspective floor, so the cube reads as
 * floating above it (the floor is the hero's only background; on phones the glow reads as a shadow).
 * Rendered on the server as inline SVG, so it costs no request and no client JS. It is also the
 * fallback and loading state for the 3D element (see HeroVisual).
 */

const VIEW = 400;
const CENTER = VIEW / 2;

const { outerPath, innerPath, spokesPath, outerPoints } = cubeGeometry({ view: VIEW, scale: 100 });
// The cube's lowest corner is at y ≈ 350; the floor glow sits a little below it.
const FLOOR_GLOW = { cy: 374, rx: 128, ry: 16 };

type HeroPosterProps = {
  className?: string;
};

export function HeroPoster({ className }: HeroPosterProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={cx("size-full", className)}
    >
      <defs>
        <radialGradient id="hero-poster-glow">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-poster-floor-glow">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={CENTER} cy={CENTER} r={CENTER} fill="url(#hero-poster-glow)" />
      <ellipse cx={CENTER} {...FLOOR_GLOW} fill="url(#hero-poster-floor-glow)" />

      {/* The cube fades out once HeroVisual's 3D canvas is ready; the glows stay as its backdrop. */}
      <g className="transition-opacity duration-slow group-data-[3d=ready]:opacity-0">
        <g fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke">
          <path d={spokesPath} className="stroke-accent" strokeWidth={1} strokeOpacity={0.35} />
          <path d={innerPath} className="stroke-accent" strokeWidth={1.25} strokeOpacity={0.6} />
          <path d={outerPath} className="stroke-accent" strokeWidth={1.75} />
        </g>

        <g className="fill-accent">
          {outerPoints.map(({ key, point: [cx, cy] }) => (
            <circle key={key} cx={cx} cy={cy} r={3.5} />
          ))}
        </g>
      </g>
    </svg>
  );
}
