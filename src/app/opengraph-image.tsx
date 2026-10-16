import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { CubeMark } from "@/components/og/cube-mark";
import { brand } from "@/lib/brand";
import { gridPath } from "@/lib/cube";

export const alt = site.seo.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GRID_STEP = 40;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          position: "relative",
          backgroundColor: brand.bg,
          color: brand.text,
          padding: "0 80px",
        }}
      >
        {/* Faint grid, fading out towards the edges. */}
        <svg
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            <radialGradient id="fade" cx="70%" cy="50%" r="70%">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="black" />
            </radialGradient>
            <mask id="mask">
              <rect width={size.width} height={size.height} fill="url(#fade)" />
            </mask>
            <radialGradient id="glow" cx="76%" cy="50%" r="34%">
              <stop offset="0%" stopColor={brand.accent} stopOpacity={0.2} />
              <stop offset="100%" stopColor={brand.accent} stopOpacity={0} />
            </radialGradient>
          </defs>
          <path
            d={gridPath(size.width, size.height, GRID_STEP)}
            stroke={brand.border}
            strokeWidth={1}
            mask="url(#mask)"
          />
          <rect width={size.width} height={size.height} fill="url(#glow)" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 1,
              color: brand.accent,
            }}
          >
            {site.seo.ogLabel}
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 84, lineHeight: 1.05, letterSpacing: -2 }}>
            {site.name}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 36, lineHeight: 1.3, color: brand.textMuted }}>
            {site.headline}
          </div>
        </div>

        <div style={{ display: "flex", position: "absolute", right: 60, top: 85 }}>
          <CubeMark size={460} stroke={5} />
        </div>
      </div>
    ),
    size,
  );
}
