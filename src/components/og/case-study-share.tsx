import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ContentImage } from "@/content/types";
import { brand } from "@/lib/brand";
import { gridPath } from "@/lib/cube";

export const shareImageSize = { width: 1200, height: 630 };

const GRID_STEP = 40;
const SCREEN_HEIGHT = 500;
const BEZEL = 10;

type CaseStudyShareProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** A portrait phone screenshot from /public, shown upright in a phone frame. */
  screenshot: ContentImage;
};

const mimeTypes: Record<string, string> = { jpeg: "image/jpeg", jpg: "image/jpeg", png: "image/png" };

// Cached so the share image prerenders at build time (Cache Components treats uncached I/O as dynamic).
async function publicImageDataUrl(src: string): Promise<string> {
  "use cache";
  const data = await readFile(join(process.cwd(), "public", src));
  const extension = src.split(".").pop() ?? "";
  return `data:${mimeTypes[extension] ?? "image/png"};base64,${data.toString("base64")}`;
}

/** A 1200×630 share image for a case study with phone screenshots: the text on the left, the phone on the right. */
export async function caseStudyShareImage({ eyebrow, title, subtitle, screenshot }: CaseStudyShareProps) {
  const { width, height } = shareImageSize;
  const screenWidth = Math.round((SCREEN_HEIGHT * screenshot.width) / screenshot.height);
  const imageUrl = await publicImageDataUrl(screenshot.src);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          backgroundColor: brand.bg,
          color: brand.text,
          padding: "0 110px 0 80px",
        }}
      >
        {/* Faint grid, fading out towards the edges, with an accent glow behind the phone. */}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <radialGradient id="fade" cx="75%" cy="50%" r="70%">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="black" />
            </radialGradient>
            <mask id="mask">
              <rect width={width} height={height} fill="url(#fade)" />
            </mask>
            <radialGradient id="glow" cx="80%" cy="50%" r="32%">
              <stop offset="0%" stopColor={brand.accent} stopOpacity={0.22} />
              <stop offset="100%" stopColor={brand.accent} stopOpacity={0} />
            </radialGradient>
          </defs>
          <path d={gridPath(width, height, GRID_STEP)} stroke={brand.border} strokeWidth={1} mask="url(#mask)" />
          <rect width={width} height={height} fill="url(#glow)" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", width: 700 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 1, color: brand.accent }}>{eyebrow}</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 80, lineHeight: 1.05, letterSpacing: -2 }}>
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 36, lineHeight: 1.3, color: brand.textMuted }}>
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            padding: BEZEL,
            borderRadius: 40,
            backgroundColor: brand.surface,
            border: `2px solid ${brand.border}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>, not next/image. */}
          <img src={imageUrl} alt="" width={screenWidth} height={SCREEN_HEIGHT} style={{ borderRadius: 30 }} />
        </div>
      </div>
    ),
    shareImageSize,
  );
}
