"use client";

import { useEffect } from "react";
import { whenIdle } from "@/components/three/gate";
import { useMotionOn } from "@/lib/use-motion-on";

/*
 * Plays each card's SCAN sweep (see ScanFrame) once, the first time the card scrolls into view.
 * One observer for every [data-scan] element on the page. Sets data-scan-play="run"; the CSS animation
 * only runs under data-motion="on". Never starts in a hidden tab; stops while motion is off.
 * The same observer runs the perspective floor's one sweep when the VR/AR section first enters
 * (data-floor-scan on <html>; .floor-sweep in globals.css), if the floor is showing.
 * It also shows the floor (data-floor on <html>) once the browser is idle after load, so the floor's
 * raster never delays first paint. A second observer, motion or not, marks VR/AR crossing the middle of the viewport (data-floor-xr on
 * <html>), which brightens the floor wherever its scroll-driven view timeline doesn't run (phones, motion
 * off, browsers without scroll timelines).
 */

// Once per page load, even if the home page remounts after client-side navigation.
const played = new Set<string>();
const FLOOR_KEY = "floor:vr-ar";

/** Runs the floor's sweep once, and marks it done when it ends or is cut short (motion switched off). */
function playFloorSweep() {
  played.add(FLOOR_KEY);
  const sweep = document.querySelector<HTMLElement>(".floor-sweep");
  // No floor on this page: nothing to sweep.
  if (!sweep || sweep.getClientRects().length === 0) return;
  const root = document.documentElement;
  const done = (event: AnimationEvent) => {
    if (event.animationName !== "floor-sweep") return;
    root.dataset.floorScan = "done";
    sweep.removeEventListener("animationend", done);
    sweep.removeEventListener("animationcancel", done);
  };
  sweep.addEventListener("animationend", done);
  sweep.addEventListener("animationcancel", done);
  root.dataset.floorScan = "run";
}

// VR/AR counts as "on the floor" while it overlaps the middle of the viewport.
const FLOOR_XR_MARGIN = "-35% 0px -35% 0px";

export function ScanObserver() {
  const motionOn = useMotionOn();

  useEffect(
    () =>
      whenIdle(() => {
        document.documentElement.dataset.floor = "";
      }),
    [],
  );

  useEffect(() => {
    const section = document.getElementById("vr-ar");
    if (!section) return;
    const root = document.documentElement;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) root.dataset.floorXr = "";
        else delete root.dataset.floorXr;
      },
      { rootMargin: FLOOR_XR_MARGIN },
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
      delete root.dataset.floorXr;
    };
  }, []);

  useEffect(() => {
    if (!motionOn) return;

    const pending: HTMLElement[] = [];
    const floorSection = document.getElementById("vr-ar");
    const play = (card: HTMLElement) => {
      if (card === floorSection) {
        playFloorSweep();
        return;
      }
      played.add(card.dataset.scan ?? "");
      // Marked done when it ends (or is cut short), so switching motion off and on never replays it.
      const done = (event: AnimationEvent) => {
        if (event.animationName !== "scan-sweep") return;
        card.setAttribute("data-scan-play", "done");
        card.removeEventListener("animationend", done);
        card.removeEventListener("animationcancel", done);
      };
      card.addEventListener("animationend", done);
      card.addEventListener("animationcancel", done);
      card.setAttribute("data-scan-play", "run");
    };
    const flushPending = () => {
      if (document.hidden) return;
      pending.splice(0).forEach(play);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const card = entry.target as HTMLElement;
          observer.unobserve(card);
          if (document.hidden) pending.push(card);
          else play(card);
        }
      },
      // A little after Reveal's trigger, so the sweep runs on a card that is already showing.
      { rootMargin: "0px 0px -20% 0px" },
    );

    document.querySelectorAll<HTMLElement>("[data-scan]").forEach((card) => {
      if (!played.has(card.dataset.scan ?? "")) observer.observe(card);
    });
    if (floorSection && !played.has(FLOOR_KEY)) observer.observe(floorSection);
    document.addEventListener("visibilitychange", flushPending);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", flushPending);
    };
  }, [motionOn]);

  return null;
}
