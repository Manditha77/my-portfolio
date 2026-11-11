import { preload } from "react-dom";
import { gridPath as buildGridPath } from "@/lib/cube";
import { cx } from "@/lib/cx";
import { site } from "@/content/site";
import portrait from "./portrait.json";

/*
 * Static poster for the hero visual: the block portrait as a pre-rendered image over a faded grid. The images
 * are drawn offline (scripts/portrait/render_poster.py), one per theme, exactly as the 3D portrait shows at
 * rest. It is what phones, Motion off and browsers without WebGL2 see, and the loading state and fallback
 * for the 3D element (see HeroVisual); once the canvas has drawn in the same spot, the poster fades out.
 *
 * A <picture> rather than next/image: the AVIF and WebP files are pre-encoded at their exact size with
 * transparency, and must stay pixel-identical to the canvas (CLAUDE.md §7 exception).
 */

const VIEW = 400;
const CENTER = VIEW / 2;
const gridPath = buildGridPath(VIEW, VIEW, 25);

const HEIGHT = portrait.posterHeight;
const WIDTH = Math.round((HEIGHT * (portrait.cols + 2 * portrait.margin)) / (portrait.rows + 2 * portrait.margin));
const src = (theme: "dark" | "light", ext: "avif" | "webp") => `/images/hero/portrait-${theme}.${ext}`;

/*
 * The poster is usually the LCP element (on phones too: it is mostly inside the first viewport, and larger
 * than the intro). Both pictures are lazy, so the hidden theme's image never downloads; but a lazy image
 * waits for the main thread before it is painted. So this runs as soon as both are parsed, before first
 * layout, and makes the current theme's image eager and high priority. data-theme is set in <head>.
 */
const prioritiseScript = `(function(){try{var t=document.documentElement.getAttribute("data-theme")==="light"?"light":"dark";var i=document.querySelector('img[data-portrait="'+t+'"]');if(i){i.setAttribute("fetchpriority","high");i.loading="eager"}}catch(e){}})()`;

type PosterImageProps = {
  theme: "dark" | "light";
  className: string;
};

function PosterImage({ theme, className }: PosterImageProps) {
  return (
    <picture>
      <source type="image/avif" srcSet={src(theme, "avif")} />
      {/* The script below may make one eager before hydration. */}
      <img
        data-portrait={theme}
        suppressHydrationWarning
        src={src(theme, "webp")}
        width={WIDTH}
        height={HEIGHT}
        alt={site.hero.portraitAlt}
        loading="lazy"
        decoding="async"
        className={cx("absolute inset-0 size-full object-contain", className)}
      />
    </picture>
  );
}

export function HeroPoster() {
  // Fetched from <head> as soon as the HTML arrives, for the OS theme (the site's default theme). A visitor
  // who chose the other theme on the site fetches that image instead, through the script below.
  preload(src("dark", "avif"), { as: "image", type: "image/avif", fetchPriority: "high", media: "(prefers-color-scheme: dark)" });
  preload(src("light", "avif"), { as: "image", type: "image/avif", fetchPriority: "high", media: "(prefers-color-scheme: light)" });

  return (
    // Fades out once HeroVisual's 3D canvas has drawn, after the canvas's own fade-in, so the two never dim
    // each other halfway. Opacity keeps the image in the accessibility tree.
    <div className="absolute inset-0 transition-opacity duration-400 group-data-[3d=ready]:opacity-0 group-data-[3d=ready]:delay-400">
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 size-full"
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
      </svg>

      <PosterImage theme="dark" className="light:hidden" />
      <PosterImage theme="light" className="hidden light:block" />
      <script dangerouslySetInnerHTML={{ __html: prioritiseScript }} />
    </div>
  );
}
