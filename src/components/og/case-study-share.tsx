import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ContentImage } from "@/content/types";
import type { ScreenshotShape } from "@/content/xr";
import { brand } from "@/lib/brand";
import { gridPath } from "@/lib/cube";

export const shareImageSize = { width: 1200, height: 630 };

const GRID_STEP = 40;
const SCREEN_HEIGHT = 500;
const BEZEL = 10;
const WINDOW_WIDTH = 520;
const WINDOW_BEZEL = 8;

type CaseStudyShareProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** A screenshot from /public: a portrait phone capture in a phone frame, or a landscape one in a window frame. */
  screenshot: ContentImage;
  shape?: ScreenshotShape;
};

const mimeTypes: Record<string, string> = { jpeg: "image/jpeg", jpg: "image/jpeg", png: "image/png" };

// Cached so the share image prerenders at build time (Cache Components treats uncached I/O as dynamic).
async function publicImageDataUrl(src: string): Promise<string> {
  "use cache";
  const data = await readFile(join(process.cwd(), "public", src));
  const extension = src.split(".").pop() ?? "";
  return `data:${mimeTypes[extension] ?? "image/png"};base64,${data.toString("base64")}`;
}

/** A 1200×630 share image for a case study: the text on the left, the screenshot on the right. */
export async function caseStudyShareImage({ eyebrow, title, subtitle, screenshot, shape = "phone" }: CaseStudyShareProps) {
  const { width, height } = shareImageSize;
  const phone = shape === "phone";
  // The phone is set by its height; a landscape window by its width.
  const screenWidth = phone ? Math.round((SCREEN_HEIGHT * screenshot.width) / screenshot.height) : WINDOW_WIDTH;
  const screenHeight = phone ? SCREEN_HEIGHT : Math.round((WINDOW_WIDTH * screenshot.height) / screenshot.width);
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
          padding: phone ? "0 110px 0 80px" : "0 70px 0 80px",
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

        <div style={{ display: "flex", flexDirection: "column", width: phone ? 700 : 470 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 1, color: brand.accent }}>{eyebrow}</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: phone ? 80 : 68, lineHeight: 1.05, letterSpacing: -2 }}>
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: phone ? 36 : 32, lineHeight: 1.3, color: brand.textMuted }}>
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            padding: phone ? BEZEL : WINDOW_BEZEL,
            borderRadius: phone ? 40 : 14,
            backgroundColor: brand.surface,
            border: `2px solid ${brand.border}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>, not next/image. */}
          <img src={imageUrl} alt="" width={screenWidth} height={screenHeight} style={{ borderRadius: phone ? 30 : 8 }} />
        </div>
      </div>
    ),
    shareImageSize,
  );
}
