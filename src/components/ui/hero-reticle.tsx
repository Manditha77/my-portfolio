"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useMotionOn } from "@/lib/use-motion-on";

/*
 * SCAN (from AR Elemental Arena): inside the hero, a small accent ring reticle follows the pointer with
 * slight easing, over a patch of dot "surface" that shows only around it, as the game's reticle finds a
 * floor. Render it as the first child of a `relative isolate` section: the layer sits behind all of the
 * section's content, so no text or button contrast changes. Decorative and aria-hidden.
 * Only with site motion on and a mouse-class pointer. The animation loop runs only while the reticle
 * is catching up, so nothing runs while the pointer is still; it hides when the pointer leaves.
 */

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const SPOT = 360; // px: the patch of dots around the reticle
const DOT_STEP = 24; // px: must match .reticle-dots background-size in globals.css
const RING = 24; // px
const EASE_MS = 60; // time constant: ~95% of the way in 180ms
const SETTLED_PX = 0.3;

function subscribeFinePointer(onChange: () => void) {
  const media = window.matchMedia(FINE_POINTER_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useFinePointer(): boolean {
  return useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia(FINE_POINTER_QUERY).matches,
    () => false,
  );
}

/** Positive remainder, so the dot pattern stays fixed to the section at negative offsets too. */
function wrap(value: number): number {
  return ((value % DOT_STEP) + DOT_STEP) % DOT_STEP;
}

export function HeroReticle() {
  const motionOn = useMotionOn();
  const finePointer = useFinePointer();
  const enabled = motionOn && finePointer;
  const layerRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const section = layer?.parentElement;
    const spot = spotRef.current;
    const dots = dotsRef.current;
    const ring = ringRef.current;
    if (!enabled || !layer || !section || !spot || !dots || !ring) return;

    const client = { x: 0, y: 0 };
    let position: { x: number; y: number } | null = null;
    let inside = false;
    let frame = 0;
    let last: number | null = null;

    // Transforms only: the patch moves, and its dots shift back by the remainder so they stay put.
    const place = (x: number, y: number) => {
      const left = x - SPOT / 2;
      const top = y - SPOT / 2;
      spot.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      dots.style.transform = `translate3d(${-wrap(left)}px, ${-wrap(top)}px, 0)`;
      ring.style.transform = `translate3d(${x - RING / 2}px, ${y - RING / 2}px, 0)`;
    };

    const tick = (now: number) => {
      const rect = section.getBoundingClientRect();
      const targetX = client.x - rect.left;
      const targetY = client.y - rect.top;

      if (position === null) {
        // Entering: start on the pointer, not sliding in from the last exit point.
        position = { x: targetX, y: targetY };
      } else {
        const delta = last === null ? 16 : Math.min(now - last, 100);
        const k = 1 - Math.exp(-delta / EASE_MS);
        position.x += (targetX - position.x) * k;
        position.y += (targetY - position.y) * k;
      }
      last = now;
      place(position.x, position.y);

      if (Math.abs(targetX - position.x) < SETTLED_PX && Math.abs(targetY - position.y) < SETTLED_PX) {
        frame = 0;
        last = null;
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (inside && frame === 0) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      // Hybrid devices: a touch on a laptop screen shouldn't summon the reticle.
      if (event.pointerType === "touch") return;
      client.x = event.clientX;
      client.y = event.clientY;
      if (!inside) {
        inside = true;
        layer.dataset.active = "true";
      }
      kick();
    };

    const onLeave = () => {
      inside = false;
      position = null;
      layer.dataset.active = "false";
    };

    section.addEventListener("pointerenter", onMove, { passive: true });
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave, { passive: true });
    // Scrolling moves the section under a still pointer.
    window.addEventListener("scroll", kick, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      section.removeEventListener("pointerenter", onMove);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", kick);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      data-active="false"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-0 transition-opacity duration-150 ease-out data-[active=true]:opacity-100"
    >
      <div ref={spotRef} className="reticle-spot absolute top-0 left-0 overflow-hidden" style={{ width: SPOT, height: SPOT }}>
        <div
          ref={dotsRef}
          className="reticle-dots absolute top-0 left-0"
          style={{ width: SPOT + DOT_STEP, height: SPOT + DOT_STEP }}
        />
      </div>
      {/* The AR game's ring: inner radius 0.8 of the outer, so the stroke is a fifth of the radius. */}
      <svg
        ref={ringRef}
        width={RING}
        height={RING}
        viewBox="0 0 24 24"
        className="absolute top-0 left-0 fill-none stroke-accent opacity-70"
      >
        <circle cx="12" cy="12" r="10.8" strokeWidth="2.4" />
      </svg>
    </div>
  );
}
