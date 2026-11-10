import { Component, type ReactNode } from "react";

/*
 * Shared checks for the site's 3D pieces (CLAUDE.md §6). Each piece renders a poster first and only
 * requests its 3D chunk when these hold; any failure keeps the poster.
 */

// Tailwind's lg breakpoint (64rem) plus a mouse/trackpad-class pointer.
export const CAPABLE_QUERY = "(min-width: 64rem) and (hover: hover) and (pointer: fine)";

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

export function saveDataOn(): boolean {
  return (navigator as NavigatorWithConnection).connection?.saveData === true;
}

/** three.js requires WebGL2. The probe context is released straight away. */
export function hasWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

/** Runs `callback` once the page has loaded and the main thread is idle. Returns a cancel function. */
export function whenIdle(callback: () => void): () => void {
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

/** Any failure inside a 3D tree (chunk load, WebGL, model fetch) renders nothing, so the poster stays. */
export class SilentBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
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

/**
 * Tracks whether a mounted canvas should render: false while `element` is off-screen or the tab is
 * hidden. Returns a cleanup function.
 */
export function watchActive(element: Element, onChange: (active: boolean) => void): () => void {
  let onScreen = true;
  const update = () => onChange(onScreen && !document.hidden);
  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    update();
  });
  observer.observe(element);
  document.addEventListener("visibilitychange", update);
  return () => {
    observer.disconnect();
    document.removeEventListener("visibilitychange", update);
  };
}
