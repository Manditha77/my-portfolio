import { cx } from "@/lib/cx";

/*
 * Static poster for the hero visual: an orthographic projection of nested cubes (a tesseract-like
 * wireframe) over a faded grid. Rendered on the server as inline SVG, so it costs no request and
 * no client JS. Step 4 reuses it as the fallback for the 3D element (no WebGL, reduced motion, loading).
 */

type Vec3 = readonly [number, number, number];

const VIEW = 400;
const CENTER = VIEW / 2;
const SCALE = 100;
// View rotation (radians). Kept off the true isometric angle so no two vertices overlap.
const YAW = 0.6;
const PITCH = 0.45;

/** Rotate around Y, then X, then project orthographically into the 400×400 viewBox. */
function project([x, y, z]: Vec3): [number, number] {
  const rx = x * Math.cos(YAW) + z * Math.sin(YAW);
  const rz = -x * Math.sin(YAW) + z * Math.cos(YAW);
  const ry = y * Math.cos(PITCH) - rz * Math.sin(PITCH);
  return [CENTER + rx * SCALE, CENTER - ry * SCALE];
}

function cubeVertices(half: number): Vec3[] {
  const vertices: Vec3[] = [];
  for (const x of [-half, half]) {
    for (const y of [-half, half]) {
      for (const z of [-half, half]) vertices.push([x, y, z]);
    }
  }
  return vertices;
}

/** Indices of vertex pairs that differ in exactly one axis (the 12 cube edges). */
const CUBE_EDGES: [number, number][] = [];
for (let a = 0; a < 8; a++) {
  for (let b = a + 1; b < 8; b++) {
    const diff = a ^ b;
    if (diff === 1 || diff === 2 || diff === 4) CUBE_EDGES.push([a, b]);
  }
}

function segmentsPath(pairs: [Vec3, Vec3][]): string {
  return pairs
    .map(([from, to]) => {
      const [x1, y1] = project(from);
      const [x2, y2] = project(to);
      return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    })
    .join("");
}

const outer = cubeVertices(1);
const inner = cubeVertices(0.5);
const outerPath = segmentsPath(CUBE_EDGES.map(([a, b]) => [outer[a], outer[b]]));
const innerPath = segmentsPath(CUBE_EDGES.map(([a, b]) => [inner[a], inner[b]]));
const spokesPath = segmentsPath(outer.map((vertex, i) => [vertex, inner[i]]));
const outerPoints = outer.map((vertex) => ({ key: vertex.join(","), point: project(vertex) }));

const GRID_STEP = 25;
const gridPath = Array.from({ length: VIEW / GRID_STEP - 1 }, (_, i) => (i + 1) * GRID_STEP)
  .map((p) => `M${p} 0V${VIEW}M0 ${p}H${VIEW}`)
  .join("");

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
    </svg>
  );
}
