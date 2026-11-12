"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ArCreature } from "@/content/xr";
import { useMotionOn } from "@/lib/use-motion-on";
import { CAPABLE_QUERY, SilentBoundary, hasWebGL2, saveDataOn, watchActive } from "./gate";
import type { CreatureViewerLabels } from "./creature-viewer";

/*
 * Gate for the AR card's creature viewer. The server-rendered screenshot (children) always renders and
 * is the fallback and loading state. The viewer chunk and its first model are only requested on large
 * screens with a fine hover pointer, site motion on, no Save-Data and WebGL2, and only once the card
 * first scrolls into view. If the conditions stop holding, the viewer unmounts and frees its models.
 */

const CreatureViewer = dynamic(() => import("./creature-viewer").then((m) => m.CreatureViewer), {
  ssr: false,
  loading: () => null,
});

function subscribeCapable(onChange: () => void) {
  const media = window.matchMedia(CAPABLE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useCapable(): boolean {
  return useSyncExternalStore(
    subscribeCapable,
    () => window.matchMedia(CAPABLE_QUERY).matches,
    () => false,
  );
}

type CreatureStageProps = {
  creatures: readonly ArCreature[];
  labels: CreatureViewerLabels;
  children: ReactNode;
};

export function CreatureStage({ creatures, labels, children }: CreatureStageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const motionOn = useMotionOn();
  const capable = useCapable();
  const [seen, setSeen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);

  const eligible = motionOn && capable && !failed;
  const show = eligible && seen;
  const live = show && ready;

  // Wait for the card's first entry into view (a little past the edge, as the SCAN sweep does).
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!eligible || seen || !wrapper || saveDataOn() || !hasWebGL2()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setSeen(true);
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [eligible, seen]);

  // While mounted: pause when off-screen or the tab is hidden.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!show || !wrapper) return;
    return watchActive(wrapper, setActive);
  }, [show]);

  return (
    <div ref={wrapperRef} data-3d={live ? "ready" : "idle"} className="group relative size-full">
      <div aria-hidden={live || undefined} className="size-full">
        {children}
      </div>
      {show && (
        <div
          inert={!live}
          className="absolute inset-0 opacity-0 transition-opacity duration-base group-data-[3d=ready]:opacity-100"
        >
          <SilentBoundary onError={() => setFailed(true)}>
            <CreatureViewer
              creatures={creatures}
              labels={labels}
              active={active}
              onReadyChange={setReady}
              onFail={() => setFailed(true)}
            />
          </SilentBoundary>
        </div>
      )}
    </div>
  );
}
