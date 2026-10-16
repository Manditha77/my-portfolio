"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type YouTubeFacadeProps = {
  youtubeId: string;
  title: string;
  playLabel: string;
  /** The local poster, rendered on the server. Nothing loads from YouTube until the click. */
  children: ReactNode;
};

export function YouTubeFacade({ youtubeId, title, playLabel, children }: YouTubeFacadeProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 size-full"
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={playLabel}
      onClick={() => setPlaying(true)}
      // Inset ring: the frame's overflow-hidden would clip the default outward outline.
      className="group absolute inset-0 size-full cursor-pointer focus-visible:-outline-offset-4"
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 flex size-16 -translate-1/2 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-lg transition-transform duration-150 ease-out group-hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
