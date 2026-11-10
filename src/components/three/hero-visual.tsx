"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionOn } from "@/lib/use-motion-on";
import { CAPABLE_QUERY, SilentBoundary, hasWebGL2, saveDataOn, watchActive, whenIdle } from "./gate";
import type { PointerState } from "./parts-cube";

/*
 * Gate for the hero's 3D element. The server-rendered poster (children) always renders and is the
 * fallback and loading state. The 3D chunk is only requested on large screens with a fine hover
 * pointer, site motion on (data-motion), no Save-Data and WebGL2, and only once the browser is idle.
 */

const PartsCube = dynamic(() => import("./parts-cube").then((m) => m.PartsCube), {
  ssr: false,
  loading: () => null,
});

const ACTIVITY_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel", "scroll"] as const;

type HeroVisualProps = {
  children: ReactNode;
};

export function HeroVisual({ children }: HeroVisualProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, inside: false, lastMove: 0, lastActivity: 0 });
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(true);
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

  // While 3D is mounted: pause when off-screen or the tab is hidden, track the pointer, and note any
  // interaction on the page (the cube only "breathes" once nothing has happened for a few seconds).
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!enabled || !wrapper) return;

    const stopWatching = watchActive(wrapper, setActive);

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
      stopWatching();
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerleave", onLeave);
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, onActivity);
    };
  }, [enabled]);

  const show3d = enabled && !failed;

  return (
    <div ref={wrapperRef} data-3d={show3d && ready ? "ready" : "idle"} className="group relative size-full">
      {children}
      {show3d && (
        <div className="absolute inset-0 opacity-0 transition-opacity duration-400 group-data-[3d=ready]:opacity-100">
          <SilentBoundary onError={() => setFailed(true)}>
            <PartsCube
              active={active}
              pointerRef={pointerRef}
              onReady={() => setReady(true)}
              onFail={() => setFailed(true)}
            />
          </SilentBoundary>
        </div>
      )}
    </div>
  );
}
