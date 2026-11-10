"use client";

import { useEffect } from "react";
import { useMotionOn } from "@/lib/use-motion-on";

/*
 * Plays each card's SCAN sweep (see ScanFrame) once, the first time the card scrolls into view.
 * One observer for every [data-scan] element on the page. Sets data-scan-play="run"; the CSS animation
 * only runs under data-motion="on". Never starts in a hidden tab; stops while motion is off.
 */

// Once per page load, even if the home page remounts after client-side navigation.
const played = new Set<string>();

export function ScanObserver() {
  const motionOn = useMotionOn();

  useEffect(() => {
    if (!motionOn) return;

    const pending: HTMLElement[] = [];
    const play = (card: HTMLElement) => {
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
    document.addEventListener("visibilitychange", flushPending);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", flushPending);
    };
  }, [motionOn]);

  return null;
}
