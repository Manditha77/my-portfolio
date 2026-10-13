"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import type { PointerState } from "./parts-cube";

/*
 * Gate for the hero's 3D element. The server-rendered poster (children) always renders and is the
 * fallback and loading state. The 3D chunk is only requested on large screens with a fine hover
 * pointer, no reduced motion, no Save-Data and WebGL2, and only once the browser is idle.
 */

const PartsCube = dynamic(() => import("./parts-cube").then((m) => m.PartsCube), {
  ssr: false,
  loading: () => null,
});

// Tailwind's lg breakpoint (64rem) plus a mouse/trackpad-class pointer.
const CAPABLE_QUERY = "(min-width: 64rem) and (hover: hover) and (pointer: fine)";
const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

function saveDataOn(): boolean {
  return (navigator as NavigatorWithConnection).connection?.saveData === true;
}

/** three.js requires WebGL2. The probe context is released straight away. */
function hasWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

/** Runs `callback` once the page has loaded and the main thread is idle. Returns a cancel function. */
function whenIdle(callback: () => void): () => void {
  let idleId: number | undefined;
  let timeoutId: number | undefined;

  const schedule = () => {
    // Safari has no requestIdleCallback; a short timeout after load is close enough.
    if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(callback, { timeout: 2000 });
    else timeoutId = window.setTimeout(callback, 200);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
}

/** Any failure inside the 3D tree (chunk load, WebGL) renders nothing, so the poster stays. */
class SilentBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type HeroVisualProps = {
  children: ReactNode;
};

export function HeroVisual({ children }: HeroVisualProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, inside: false, lastMove: 0 });
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(true);

  // Decide whether to load 3D at all, and unload it if the conditions stop holding.
  useEffect(() => {
    if (saveDataOn() || !hasWebGL2()) return;

    const capable = window.matchMedia(CAPABLE_QUERY);
    const motion = window.matchMedia(MOTION_QUERY);
    let cancelIdle: (() => void) | undefined;

    const scheduleLoad = () => {
      cancelIdle = whenIdle(() => setEnabled(true));
    };

    const onChange = () => {
      cancelIdle?.();
      cancelIdle = undefined;
      if (capable.matches && motion.matches) {
        scheduleLoad();
      } else {
        setEnabled(false);
        setReady(false);
      }
    };

    if (capable.matches && motion.matches) scheduleLoad();
    capable.addEventListener("change", onChange);
    motion.addEventListener("change", onChange);
    return () => {
      cancelIdle?.();
      capable.removeEventListener("change", onChange);
      motion.removeEventListener("change", onChange);
    };
  }, []);

  // While 3D is mounted: pause when off-screen or the tab is hidden, and track the pointer.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!enabled || !wrapper) return;

    let onScreen = true;
    const update = () => setActive(onScreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    observer.observe(wrapper);
    document.addEventListener("visibilitychange", update);

    const pointer = pointerRef.current;
    const onMove = (event: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.inside = true;
      pointer.lastMove = performance.now();
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    wrapper.addEventListener("pointermove", onMove, { passive: true });
    wrapper.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerleave", onLeave);
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
