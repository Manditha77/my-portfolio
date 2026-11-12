"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useMotionOn } from "@/lib/use-motion-on";

/*
 * SCAN (from AR Elemental Arena): the game's ring reticle, lying on the perspective floor wherever the
 * pointer meets it, like the game's hit-test reticle finding a surface. It belongs to the hero only: it
 * shows while the pointer is over the hero (below the sticky header) and the hero still fills the top half
 * of the viewport, hides once the page scrolls on, and is clipped to the hero's box, so even its glow never
 * reaches the next section (the floor runs on behind the whole page). Rendered inside
 * PerspectiveFloor, so it sits at the floor's depth: behind all content and behind The Build's cube.
 * The pointer's height gives the depth along the floor; the ring and a faint glow under it are scaled to
 * that depth and flattened by the floor's tilt, so they read as ellipses lying on it. Above the horizon
 * there is no floor to hit, so the reticle hides; it fades as it nears the horizon.
 * The floor's geometry is read from its CSS (perspective, perspective-origin, --floor-tilt) and its box.
 * Same gate as the floor: large screen, a mouse-class pointer, site motion on. The animation loop runs
 * only while the reticle is catching up, so nothing runs while the pointer is still. Decorative.
 */

const FLOOR_QUERY = "(min-width: 64rem) and (hover: hover) and (pointer: fine)";
const RING = 36; // px: the ring's radius where the floor meets the bottom of the viewport
const GLOW = 3; // the glow's radius, in ring radii
const EASE_MS = 60; // time constant: ~95% of the way in 180ms
const SETTLED_PX = 0.3;
// Fully shown above this on-screen scale, hidden below the lower one (towards the horizon).
const SHOW_FROM = 0.35;
const HIDE_BELOW = 0.12;

function subscribeFloor(onChange: () => void) {
  const media = window.matchMedia(FLOOR_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useFloorShown(): boolean {
  return useSyncExternalStore(
    subscribeFloor,
    () => window.matchMedia(FLOOR_QUERY).matches,
    () => false,
  );
}

type FloorGeometry = { depth: number; vanishY: number; sin: number; cos: number };

function readGeometry(floor: HTMLElement): FloorGeometry | null {
  const layer = floor.querySelector(".floor-view");
  if (!layer) return null;
  const styles = getComputedStyle(layer);
  const depth = parseFloat(styles.perspective);
  const vanishY = parseFloat(styles.perspectiveOrigin.split(" ")[1] ?? "");
  const tilt = (parseFloat(getComputedStyle(floor).getPropertyValue("--floor-tilt")) * Math.PI) / 180;
  if (!(depth > 0) || Number.isNaN(vanishY) || Number.isNaN(tilt)) return null;
  return { depth, vanishY, sin: Math.sin(tilt), cos: Math.cos(tilt) };
}

/**
 * Where a point `y` px down the floor's box (height `height`) lands on the floor: its on-screen scale
 * across (`x`) and down (`y`, the tilt's flattening), or null above the horizon.
 */
function projectOnFloor(y: number, height: number, { depth: p, vanishY, sin, cos }: FloorGeometry) {
  const below = (y - vanishY) * sin + p * cos;
  if (below <= 0) return null;
  // Distance along the floor from its near edge (the bottom of the box).
  const along = Math.max(0, (p * (height - y)) / below);
  const recede = p + along * sin;
  return { x: p / recede, y: (p * (p * cos + (height - vanishY) * sin)) / (recede * recede) };
}

export function HeroReticle() {
  const motionOn = useMotionOn();
  const floorShown = useFloorShown();
  const enabled = motionOn && floorShown;
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    const floor = root?.parentElement;
    const hero = document.getElementById("top");
    const header = document.querySelector("header");
    const glow = glowRef.current;
    const ring = ringRef.current;
    if (!enabled || !root || !layer || !floor || !hero || !glow || !ring) return;

    let geometry = readGeometry(floor);
    const client = { x: 0, y: 0 };
    let position: { x: number; y: number } | null = null;
    // Shown (inside) only while the pointer is on the page (pointerIn) and over the hero (heroShown).
    let inside = false;
    let pointerIn = false;
    let frame = 0;
    let last: number | null = null;

    // Transforms only: both circles are centred on the point and scaled to lie on the floor there.
    const place = (x: number, y: number, height: number) => {
      const scale = geometry && projectOnFloor(y, height, geometry);
      const shown = scale ? Math.min(1, Math.max(0, (scale.x - HIDE_BELOW) / (SHOW_FROM - HIDE_BELOW))) : 0;
      layer.style.opacity = String(shown);
      if (!scale || shown === 0) return;
      const squash = `scale(${scale.x}, ${scale.y})`;
      ring.style.transform = `translate3d(${x - RING}px, ${y - RING}px, 0) ${squash}`;
      glow.style.transform = `translate3d(${x - RING * GLOW}px, ${y - RING * GLOW}px, 0) ${squash}`;
    };

    // The hero's visible box in the viewport: below the sticky header.
    const heroBox = () => {
      const { top, bottom } = hero.getBoundingClientRect();
      return { top: Math.max(top, header?.getBoundingClientRect().bottom ?? 0), bottom };
    };

    // The hero still fills the top half of the viewport, and the pointer is over it.
    const heroShown = () => {
      const { top, bottom } = heroBox();
      return bottom > window.innerHeight / 2 && client.y >= top && client.y <= bottom;
    };

    // Cut to the hero's box (in the floor's coordinates), so nothing of it shows past the hero's edges.
    const clipToHero = (rect: DOMRect) => {
      const { top, bottom } = heroBox();
      root.style.clipPath = `inset(${Math.max(0, top - rect.top)}px 0 ${Math.max(0, rect.bottom - bottom)}px 0)`;
    };
    const setActive = (active: boolean) => {
      inside = active;
      if (!active) position = null;
      root.dataset.active = String(active);
    };

    const tick = (now: number) => {
      if (!heroShown()) {
        setActive(false);
        frame = 0;
        last = null;
        return;
      }
      const rect = floor.getBoundingClientRect();
      clipToHero(rect);
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
      place(position.x, position.y, rect.height);

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
      pointerIn = true;
      if (!inside && heroShown()) setActive(true);
      kick();
    };

    const onLeave = () => {
      pointerIn = false;
      setActive(false);
    };

    // The vanishing point is in px, so it moves with the viewport.
    const onResize = () => {
      geometry = readGeometry(floor);
      kick();
    };

    const page = document.documentElement;
    page.addEventListener("pointermove", onMove, { passive: true });
    page.addEventListener("pointerleave", onLeave, { passive: true });
    // Scrolling moves the hero under a still pointer (and its clip with it), and can scroll it away.
    const onScroll = () => {
      if (!inside && pointerIn && heroShown()) setActive(true);
      if (inside) clipToHero(floor.getBoundingClientRect());
      kick();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      page.removeEventListener("pointermove", onMove);
      page.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    // The wrapper fades in and out with the pointer; the layer inside fades towards the horizon.
    <div
      ref={rootRef}
      data-active="false"
      className="absolute inset-0 opacity-0 transition-opacity duration-fast ease-out data-[active=true]:opacity-100"
    >
      <div ref={layerRef} className="absolute inset-0">
        <div
          ref={glowRef}
          className="absolute top-0 left-0 rounded-full bg-[radial-gradient(closest-side,var(--accent),transparent)] opacity-15"
          style={{ width: 2 * RING * GLOW, height: 2 * RING * GLOW }}
        />
        {/* The AR game's ring: inner radius 0.8 of the outer, so the stroke is a fifth of the radius. */}
        <svg
          ref={ringRef}
          width={2 * RING}
          height={2 * RING}
          viewBox="0 0 24 24"
          className="absolute top-0 left-0 fill-none stroke-accent opacity-70"
        >
          <circle cx="12" cy="12" r="10.8" strokeWidth="2.4" />
        </svg>
      </div>
    </div>
  );
}
