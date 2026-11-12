"use client";

import dynamic from "next/dynamic";
import { useBootState } from "@/lib/use-boot-state";
import { CAPABLE_QUERY, hasWebGL2, saveDataOn } from "./gate";

/*
 * Gate for the cube boot's 3D growth (boot-growth.tsx), the one 3D piece that loads before idle (CLAUDE.md
 * §6): only while the boot plays, on a large screen with a fine hover pointer, site motion on, no
 * Save-Data and WebGL2. The chunk is requested when this module first runs, as the page's JS starts and
 * before hydration, so it has the best chance of being ready mid-growth; everywhere else (phones, tablets,
 * Motion off, a return visit) it is never requested, and the poster's SVG growth plays alone. The h1 and
 * intro are revealed by CSS on the boot's clock, so nothing here can delay them.
 */

const loadBootGrowth = () => import("./boot-growth");

function wanted(): boolean {
  const root = document.documentElement;
  return (
    root.getAttribute("data-boot") === "play" &&
    root.getAttribute("data-motion") === "on" &&
    window.matchMedia(CAPABLE_QUERY).matches &&
    !saveDataOn() &&
    hasWebGL2()
  );
}

// At module evaluation, not in an effect: an effect would wait for hydration.
const requested = typeof window !== "undefined" && wanted();
if (requested) void loadBootGrowth().catch(() => undefined);

const BootGrowth = dynamic(() => loadBootGrowth().then((m) => m.BootGrowth), {
  ssr: false,
  loading: () => null,
});

export function BootGrowthGate() {
  const playing = useBootState() === "play";
  return requested && playing ? <BootGrowth /> : null;
}
