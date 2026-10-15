import Image from "next/image";
import type { ContentImage } from "@/content/types";
import type { XrVideo as XrVideoContent } from "@/content/xr";
import { xrCopy } from "@/content/xr";
import { Badge } from "@/components/ui/badge";
import { YouTubeFacade } from "./youtube-facade";

type XrVideoProps = {
  video: XrVideoContent;
  poster: ContentImage;
};

const frame = "relative aspect-video overflow-hidden rounded-lg border border-border bg-bg";

/** The demo video as a click-to-load facade, or the poster with a "coming soon" label until a video exists. */
export function XrVideo({ video, poster }: XrVideoProps) {
  const posterImage = (
    <Image
      src={poster.src}
      alt={video.youtubeId ? "" : poster.alt}
      width={poster.width}
      height={poster.height}
      sizes="(min-width: 1100px) 1100px, 100vw"
      loading="eager"
      className="size-full object-cover"
    />
  );

  if (!video.youtubeId) {
    return (
      <div className={frame}>
        {posterImage}
        <Badge className="absolute top-3 left-3 bg-bg/90 backdrop-blur-sm">{xrCopy.videoComingSoon}</Badge>
      </div>
    );
  }

  return (
    <div className={frame}>
      <YouTubeFacade
        youtubeId={video.youtubeId}
        title={video.title}
        playLabel={`${xrCopy.playVideo} ${video.title}`}
      >
        {posterImage}
      </YouTubeFacade>
    </div>
  );
}
