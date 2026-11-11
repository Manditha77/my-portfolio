"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionOn } from "@/lib/use-motion-on";
import { CAPABLE_QUERY, SilentBoundary, hasWebGL2, saveDataOn, whenIdle } from "./gate";
import type { PointerState } from "./parts-cube";

/*
 * Gate for "The Build", the hero's block portrait that becomes a scroll companion. The server-rendered
 * poster (children: the portrait as an image) always renders and is the fallback and loading state; once
 * the 3D portrait has drawn in exactly the same spot, the poster fades out (the canvas sits behind the
 * page content). The 3D chunk is only requested on large screens with a fine hover pointer, site motion on
 * (data-motion), no Save-Data and WebGL2, and only once the browser is idle.
 */

const PartsCube = dynamic(() => import("./parts-cube").then((m) => m.PartsCube), {
  ssr: false,
  loading: () => null,
});

type HeroVisualProps = {
  children: ReactNode;
};

export function HeroVisual({ children }: HeroVisualProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, inside: false });
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const motionOn = useMotionOn();

  // Decide whether to load 3D at all, and unload it if the conditions stop holding.
  // Re-runs when site motion changes: off unmounts the canvas (the poster stays), on loads it when idle.
  useEffect(() => {
    if (!motionOn || saveDataOn() || !hasWebGL2()) return;

    const capable = window.matchMedia(CAPABLE_QUERY);
    let cancelIdle: (() => void) | undefined;

    const scheduleLoad = () => {
      cancelIdle = whenIdle(() => setEnabled(true));
    };

    const onChange = () => {
      cancelIdle?.();
      cancelIdle = undefined;
      if (capable.matches) {
        scheduleLoad();
      } else {
        setEnabled(false);
        setReady(false);
      }
    };

    if (capable.matches) scheduleLoad();
    capable.addEventListener("change", onChange);
    return () => {
      cancelIdle?.();
      capable.removeEventListener("change", onChange);
      setEnabled(false);
      setReady(false);
    };
  }, [motionOn]);

  // While 3D is mounted: track the pointer anywhere on the page, relative to the portrait's centre (it
  // turns towards it), and let it settle back when the pointer leaves the page.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!enabled || !wrapper) return;

    const pointer = pointerRef.current;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const rect = wrapper.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      const y = (event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
      pointer.x = Math.max(-1, Math.min(1, x));
      pointer.y = -Math.max(-1, Math.min(1, y));
      pointer.inside = true;
      pointer.wake?.();
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.wake?.();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  const show3d = enabled && !failed;

  return (
    <div ref={wrapperRef} data-3d={show3d && ready ? "ready" : "idle"} className="group relative size-full">
      {children}
      {show3d && (
        <SilentBoundary onError={() => setFailed(true)}>
          <PartsCube
            heroRef={wrapperRef}
            pointerRef={pointerRef}
            onReady={() => setReady(true)}
            onFail={() => setFailed(true)}
          />
        </SilentBoundary>
      )}
    </div>
  );
}
