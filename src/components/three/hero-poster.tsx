import { cubeGeometry, gridPath as buildGridPath } from "@/lib/cube";
import { cx } from "@/lib/cx";

/*
 * Static poster for the hero visual: the nested-cube motif (see lib/cube) over a faded grid.
 * Rendered on the server as inline SVG, so it costs no request and no client JS. It is also the
 * fallback and loading state for the 3D element (see HeroVisual).
 */

const VIEW = 400;
const CENTER = VIEW / 2;

const { outerPath, innerPath, spokesPath, outerPoints } = cubeGeometry({ view: VIEW, scale: 100 });
const gridPath = buildGridPath(VIEW, VIEW, 25);

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
        {/* Luminance mask: fades the grid out towards the edges. */}
        <radialGradient id="hero-poster-fade">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
        <mask id="hero-poster-mask">
          <rect width={VIEW} height={VIEW} fill="url(#hero-poster-fade)" />
        </mask>
      </defs>

      <path d={gridPath} className="stroke-border" strokeWidth={1} mask="url(#hero-poster-mask)" />
      <circle cx={CENTER} cy={CENTER} r={CENTER} fill="url(#hero-poster-glow)" />

      {/* The cube fades out once HeroVisual's 3D canvas is ready; the grid and glow stay as its backdrop. */}
      <g className="transition-opacity duration-400 group-data-[3d=ready]:opacity-0">
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
