import { useSyncExternalStore } from "react";
import type { ShapeKey } from "./build-shapes";

/*
 * "The Build": the shape the header mark docks. The lazy 3D companion sets it from the scroll path, so the
 * mark switches as each stop's beam starts printing and holds the shape between stops; null while the
 * companion isn't running (phones, Motion off, no WebGL), when the mark follows the active section instead.
 * Tiny on purpose: it sits in the main bundle.
 */

let dock: ShapeKey | null = null;
const listeners = new Set<() => void>();

export function setBuildDock(next: ShapeKey | null) {
  if (next === dock) return;
  dock = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useBuildDock(): ShapeKey | null {
  return useSyncExternalStore(
    subscribe,
    () => dock,
    () => null,
  );
}
