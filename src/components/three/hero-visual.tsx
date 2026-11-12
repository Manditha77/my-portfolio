"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useBootState } from "@/lib/use-boot-state";
import { useMotionOn } from "@/lib/use-motion-on";
import { CAPABLE_QUERY, SilentBoundary, hasWebGL2, saveDataOn, whenIdle } from "./gate";
import type { PointerState } from "./parts-cube";

/*
 * Gate for "The Build", the hero cube that becomes a scroll companion. The server-rendered poster
 * (children) always renders and is the fallback and loading state; once the 3D cube shows in the same
 * spot, the poster's own cube fades out (the canvas sits behind the page content). The 3D chunk is only
 * requested on large screens with a fine hover pointer, site motion on (data-motion), no Save-Data and
 * WebGL2, and only once the browser is idle.
 * While the cube boot plays (src/lib/boot.ts), the poster is the cube, grown and moved in CSS (on capable
 * desktops a separate 3D growth may stand in for its blocks until it settles: BootGrowthGate): the chunk is
 * fetched when idle, but the canvas only mounts once the boot has ended or been skipped, so the 3D cube
 * always crossfades in over a poster that is already finished and in place.
 * Every time 3D turns on (first load, Motion back on, the home page shown again after a client navigation,
 * a bfcache restore) it mounts a brand-new canvas: the old one's context is lost on purpose as it unmounts.
 * A failure only rules out the canvas it happened in.
 */

const loadPartsCube = () => import("./parts-cube");

const PartsCube = dynamic(() => loadPartsCube().then((m) => m.PartsCube), {
  ssr: false,
  loading: () => null,
});

const ACTIVITY_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel", "scroll"] as const;

let lastCanvasKey = 0;

type HeroVisualProps = {
  children: ReactNode;
};

export function HeroVisual({ children }: HeroVisualProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, inside: false, lastMove: 0, lastActivity: 0 });
  // The mounted canvas's key (null: no 3D), and the key of the canvas that failed, if any.
  const [canvasKey, setCanvasKey] = useState<number | null>(null);
  const [failedKey, setFailedKey] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(0);
  const motionOn = useMotionOn();
  const booting = useBootState() === "play";
  const enabled = canvasKey !== null;

  // Back from the bfcache: start over with a new canvas (the frozen one may have lost its context).
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRestored((count) => count + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Decide whether to load 3D at all, and unload it if the conditions stop holding.
  // Re-runs when site motion changes: off unmounts the canvas (the poster stays), on loads it when idle.
  // Also re-runs when the page is shown again (a hidden page runs its cleanups) and after a bfcache restore.
  // The WebGL probe creates a context, so it waits for idle and only runs where 3D could load at all.
  // During the boot it only fetches the chunk; it mounts once the boot is over (this re-runs then).
  useEffect(() => {
    if (!motionOn || saveDataOn()) return;

    const capable = window.matchMedia(CAPABLE_QUERY);
    let cancelIdle: (() => void) | undefined;

    const scheduleLoad = () => {
      cancelIdle = whenIdle(() => {
        if (!hasWebGL2()) return;
        if (booting) void loadPartsCube().catch(() => undefined);
        else setCanvasKey(++lastCanvasKey);
      });
    };

    const onChange = () => {
      cancelIdle?.();
      cancelIdle = undefined;
      if (capable.matches) {
        scheduleLoad();
      } else {
        setCanvasKey(null);
        setReady(false);
      }
    };

    if (capable.matches) scheduleLoad();
    capable.addEventListener("change", onChange);
    return () => {
      cancelIdle?.();
      capable.removeEventListener("change", onChange);
      setCanvasKey(null);
      setReady(false);
    };
  }, [motionOn, booting, restored]);

  // While 3D is mounted: track the pointer over the hero visual, and note any interaction on the
  // page (the cube only "breathes" once nothing has happened for a few seconds).
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!enabled || !wrapper) return;

    const pointer = pointerRef.current;
    const onMove = (event: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.inside = true;
      pointer.lastMove = performance.now();
      pointer.wake?.();
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    const onActivity = () => {
      pointer.lastActivity = performance.now();
    };
    onActivity();
    wrapper.addEventListener("pointermove", onMove, { passive: true });
    wrapper.addEventListener("pointerleave", onLeave, { passive: true });
    for (const type of ACTIVITY_EVENTS) window.addEventListener(type, onActivity, { passive: true });

    return () => {
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerleave", onLeave);
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, onActivity);
    };
  }, [enabled]);

  const show3d = enabled && canvasKey !== failedKey;
  const fail = () => setFailedKey(canvasKey);

  return (
    <div
      ref={wrapperRef}
      data-3d={show3d && ready ? "ready" : "idle"}
      data-boot-cube=""
      className="group relative size-full"
    >
      {children}
      {show3d && (
        <SilentBoundary key={canvasKey} onError={fail}>
          <PartsCube
            heroRef={wrapperRef}
            pointerRef={pointerRef}
            onReady={() => setReady(true)}
            onFail={fail}
          />
        </SilentBoundary>
      )}
    </div>
  );
}
