"use client";

import { useSyncExternalStore } from "react";
import { subscribeMotion } from "./motion-pref";

/** True while effects may run. Always false on the server and during hydration, so SSR never animates. */
export function useMotionOn(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => document.documentElement.getAttribute("data-motion") === "on",
    () => false,
  );
}
