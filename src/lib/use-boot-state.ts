"use client";

import { useSyncExternalStore } from "react";
import { bootState, subscribeBoot, type BootState } from "./boot";

/** The cube boot's state (src/lib/boot.ts); "none" on the server and during hydration. */
export function useBootState(): BootState {
  return useSyncExternalStore(subscribeBoot, bootState, () => "none");
}
