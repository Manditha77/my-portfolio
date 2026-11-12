"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useBootState } from "@/lib/use-boot-state";
import { useMotionOn } from "@/lib/use-motion-on";

/*
 * SCAN (from AR Elemental Arena): the game's ring reticle, lying on the perspective floor wherever the
 * pointer meets it, like the game's hit-test reticle finding a surface. Kept quiet: a small 1px ring at low
 * opacity, no glow. It belongs to the cube's column of the hero only: it shows while the pointer is around
 * or below the hero visual (its box widened by ZONE_PAD, down to the hero's bottom, below the sticky header,
 * and cut to the hero's content box and the viewport) and the hero still fills the top half of the viewport,
 * hides once the page scrolls on, and stays whole inside that zone (its centre is kept a ring's radius from
 * the edges, and it is clipped to the zone), so it never reaches the hero's text column, the side margins,
 * the window's edge or the next section (the floor runs on behind the whole page). Rendered inside PerspectiveFloor, so it sits at the floor's depth: behind all content and
 * behind The Build's cube. The pointer's height gives the depth along the floor; the ring is scaled to that
 * depth and flattened by the floor's tilt, so it reads as an ellipse lying on it, with its stroke kept at
 * about 1px on screen. Above the horizon there is no floor to hit, so the reticle hides; it fades as it
 * nears the horizon.
 * The floor's geometry is read from its CSS (perspective, perspective-origin, --floor-tilt) and its box.
 * Same gate as the floor: large screen, a mouse-class pointer, site motion on; it wakes once the cube boot
 * is over. The animation loop runs only while the reticle is catching up, so nothing runs while the
 * pointer is still. Decorative.
 */

const FLOOR_QUERY = "(min-width: 64rem) and (hover: hover) and (pointer: fine)";
const RING = 18; // px: the ring's radius where the floor meets the bottom of the viewport
const STROKE = 1; // px on screen, at any depth
const ZONE_PAD = 48; // px around the hero visual where the reticle may show
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
type Zone = { left: number; right: number; top: number; bottom: number };

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

/** The hero's content box across the viewport: its Container (hero.tsx, the section's first child) inside its side padding. */
function contentBox(hero: HTMLElement): { left: number; right: number } {
  const container = hero.firstElementChild ?? hero;
  const rect = container.getBoundingClientRect();
  const styles = getComputedStyle(container);
  return {
    left: rect.left + parseFloat(styles.paddingLeft),
    right: rect.right - parseFloat(styles.paddingRight),
  };
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
  const booting = useBootState() === "play";
  const enabled = motionOn && floorShown && !booting;
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    const floor = root?.parentElement;
    const hero = document.getElementById("top");
    const visual = hero?.querySelector<HTMLElement>("[data-boot-cube]");
    const header = document.querySelector("header");
    const ring = ringRef.current;
    const circle = circleRef.current;
    if (!enabled || !root || !layer || !floor || !hero || !visual || !ring || !circle) return;

    let geometry = readGeometry(floor);
    const client = { x: 0, y: 0 };
    let position: { x: number; y: number } | null = null;
    // Shown (inside) only while the pointer is on the page (pointerIn) and over the hero (heroShown).
    let inside = false;
    let pointerIn = false;
    let frame = 0;
    let last: number | null = null;

    // Transforms only: the ring is centred on the point and scaled to lie on the floor there; its stroke is
    // scaled back up, so it stays about 1px wide on screen.
    const place = (x: number, y: number, height: number) => {
      const scale = geometry && projectOnFloor(y, height, geometry);
      const shown = scale ? Math.min(1, Math.max(0, (scale.x - HIDE_BELOW) / (SHOW_FROM - HIDE_BELOW))) : 0;
      layer.style.opacity = String(shown);
      if (!scale || shown === 0) return;
      ring.style.transform = `translate3d(${x - RING}px, ${y - RING}px, 0) scale(${scale.x}, ${scale.y})`;
      circle.style.strokeWidth = String(STROKE / scale.x);
    };

    // The hero's content box (its Container, inside the side padding), measured on setup and resize.
    let content = contentBox(hero);

    // The reticle's zone in the viewport: the hero visual's box widened by ZONE_PAD, down to the hero's
    // bottom, below the sticky header, and cut to the hero's content box and the viewport, so at narrow
    // desktop widths (where ZONE_PAD would reach the window's edge) it stays in the visible hero. The hero's
    // text column is outside it.
    const zone = () => {
      const heroRect = hero.getBoundingClientRect();
      const visualRect = visual.getBoundingClientRect();
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      const { clientWidth, clientHeight } = document.documentElement;
      return {
        left: Math.max(visualRect.left - ZONE_PAD, content.left, 0),
        right: Math.min(visualRect.right + ZONE_PAD, content.right, clientWidth),
        top: Math.max(visualRect.top - ZONE_PAD, heroRect.top, headerBottom),
        bottom: Math.min(heroRect.bottom, clientHeight),
      };
    };

    // The hero still fills the top half of the viewport, and the pointer is in the zone.
    const heroShown = () => {
      const { left, right, top, bottom } = zone();
      const heroBottom = hero.getBoundingClientRect().bottom;
      return (
        heroBottom > window.innerHeight / 2 &&
        client.x >= left &&
        client.x <= right &&
        client.y >= top &&
        client.y <= bottom
      );
    };

    // Cut to the zone (in the floor's coordinates), so nothing of it shows past the zone's edges.
    const clipToZone = (rect: DOMRect, { left, right, top, bottom }: Zone) => {
      const inset = [top - rect.top, rect.right - right, rect.bottom - bottom, left - rect.left].map(
        (value) => `${Math.max(0, value)}px`,
      );
      root.style.clipPath = `inset(${inset.join(" ")})`;
    };

    // The ring's centre for a pointer at (x, y) in the floor's coordinates: kept inside the zone by the ring's
    // on-screen radii at that depth, so the whole ring always shows (never cut off at the zone's edge).
    const inZone = (x: number, y: number, rect: DOMRect, { left, right, top, bottom }: Zone) => {
      const radii = (atY: number) => {
        const scale = geometry && projectOnFloor(atY, rect.height, geometry);
        return scale ? { x: RING * scale.x, y: RING * scale.y } : { x: 0, y: 0 };
      };
      // A zone narrower than the ring: its middle.
      const clamp = (value: number, low: number, high: number) =>
        low > high ? (low + high) / 2 : Math.min(high, Math.max(low, value));
      const ry = radii(y).y;
      const cy = clamp(y, top - rect.top + ry, bottom - rect.top - ry);
      const rx = radii(cy).x;
      return { x: clamp(x, left - rect.left + rx, right - rect.left - rx), y: cy };
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
      const bounds = zone();
      clipToZone(rect, bounds);
      const { x: targetX, y: targetY } = inZone(client.x - rect.left, client.y - rect.top, rect, bounds);

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
      content = contentBox(hero);
      kick();
    };

    const page = document.documentElement;
    page.addEventListener("pointermove", onMove, { passive: true });
    page.addEventListener("pointerleave", onLeave, { passive: true });
    // Scrolling moves the hero under a still pointer (and its clip with it), and can scroll it away.
    const onScroll = () => {
      if (!inside && pointerIn && heroShown()) setActive(true);
      if (inside) clipToZone(floor.getBoundingClientRect(), zone());
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
        {/* The AR game's ring, drawn thin: the view box is in px, so the stroke is set in px. */}
        <svg
          ref={ringRef}
          width={2 * RING}
          height={2 * RING}
          viewBox={`0 0 ${2 * RING} ${2 * RING}`}
          className="absolute top-0 left-0 overflow-visible fill-none stroke-accent opacity-40"
        >
          <circle ref={circleRef} cx={RING} cy={RING} r={RING - STROKE / 2} strokeWidth={STROKE} />
        </svg>
      </div>
    </div>
  );
}
