"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { markSequencePlayed, sequencePlayed } from "@/lib/hero-sequence";
import { useMotionOn } from "@/lib/use-motion-on";
import { CAPABLE_QUERY, SilentBoundary, hasWebGL2, saveDataOn, whenIdle } from "./gate";
import type { PointerState } from "./parts-cube";

/*
 * Gate for "The Build", the hero cube that becomes a scroll companion. The server-rendered poster
 * (children) always renders and is the fallback and loading state; once the 3D cube shows in the same
 * spot, the poster's own cube fades out (the canvas sits behind the page content). The 3D chunk is only
 * requested on large screens with a fine hover pointer, site motion on (data-motion), no Save-Data and
 * WebGL2, and only once the browser is idle.
 * It also marks the poster's first-load build sequence (src/lib/hero-sequence.ts) as playing, once per
 * page load: a remount starts finished, and the sequence ends for good when its clock runs out or site
 * motion goes off. The 3D cube either takes over the sequence's "act" (it prints the blocks itself) or
 * waits for the sequence to finish; either way it reports in when the poster's cube can go.
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
  // Once per page load. Server render and first hydration: playing (the CSS started at first paint).
  const [sequence, setSequence] = useState<"play" | "done">(() => (sequencePlayed() ? "done" : "play"));
  const motionOn = useMotionOn();

  // The sequence ends when its clock runs out, or for good as soon as motion is off.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (sequence === "done" || !wrapper) return;
    markSequencePlayed();
    const finish = () => setSequence("done");
    if (!motionOn) {
      const frame = requestAnimationFrame(finish);
      return () => cancelAnimationFrame(frame);
    }
    const onEnd = (event: AnimationEvent) => {
      if (event.animationName === "seq-clock") finish();
    };
    wrapper.addEventListener("animationend", onEnd);
    return () => wrapper.removeEventListener("animationend", onEnd);
  }, [sequence, motionOn]);

  // Decide whether to load 3D at all, and unload it if the conditions stop holding.
  // Re-runs when site motion changes: off unmounts the canvas (the poster stays), on loads it when idle.
  // The WebGL probe creates a context, so it waits for idle and only runs where 3D could load at all.
  useEffect(() => {
    if (!motionOn || saveDataOn()) return;

    const capable = window.matchMedia(CAPABLE_QUERY);
    let cancelIdle: (() => void) | undefined;

    const scheduleLoad = () => {
      cancelIdle = whenIdle(() => {
        if (hasWebGL2()) setEnabled(true);
      });
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

  const show3d = enabled && !failed;

  return (
    <div
      ref={wrapperRef}
      data-3d={show3d && ready ? "ready" : "idle"}
      data-sequence={sequence}
      className="group relative size-full"
    >
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
