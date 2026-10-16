import Image from "next/image";
import type { ReactNode } from "react";
import type { ContentImage } from "@/content/types";
import type { ScreenshotShape, XrVideo as XrVideoContent } from "@/content/xr";
import { xrCopy } from "@/content/xr";
import { Badge } from "@/components/ui/badge";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { YouTubeFacade } from "./youtube-facade";

type XrVideoProps = {
  video: XrVideoContent;
  poster: ContentImage;
  /** A 16:9 frame, or a phone-shaped portrait frame for phone captures. */
  shape?: ScreenshotShape;
};

const frames = {
  landscape: { sizes: "(min-width: 1100px) 1100px, 100vw" },
  phone: { sizes: "300px" },
} as const;

function Frame({ shape, children }: { shape: ScreenshotShape; children: ReactNode }) {
  if (shape === "phone") {
    return <PhoneFrame className="mx-auto w-full max-w-[300px]">{children}</PhoneFrame>;
  }
  return <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-bg">{children}</div>;
}

/** The demo video as a click-to-load facade, or the poster with a "coming soon" label until a video exists. */
export function XrVideo({ video, poster, shape = "landscape" }: XrVideoProps) {
  const posterImage = (
    <Image
      src={poster.src}
      alt={video.youtubeId ? "" : poster.alt}
      width={poster.width}
      height={poster.height}
      sizes={frames[shape].sizes}
      // The LCP image on the case study page: preloaded with high fetch priority.
      preload
      className="size-full object-cover"
    />
  );

  if (!video.youtubeId) {
    return (
      <Frame shape={shape}>
        {posterImage}
        <Badge className="absolute top-3 left-3 bg-bg/90 backdrop-blur-sm">{xrCopy.videoComingSoon}</Badge>
      </Frame>
    );
  }

  return (
    <Frame shape={shape}>
      <YouTubeFacade
        youtubeId={video.youtubeId}
        title={video.title}
        playLabel={`${xrCopy.playVideo} ${video.title}`}
      >
        {posterImage}
      </YouTubeFacade>
    </Frame>
  );
}
