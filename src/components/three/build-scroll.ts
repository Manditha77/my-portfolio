import { MathUtils } from "three";
import { LAYOUT_WIDTH, type LayoutKey } from "./build-layouts";

/*
 * "The Build": where each home section's layout sits, and how far the page has scrolled between them.
 * Everything is measured from the section elements (main section[id], in DOM order), so it adapts when
 * content changes. Text that the companion must never sit behind carries data-build-clear; the
 * companion is centred in the free space to the right of it. Only imported by the lazy 3D chunk.
 */

/** Sections not listed keep the previous section's layout. Neighbours with the same layout merge. */
export const LAYOUT_BY_SECTION: Readonly<Record<string, LayoutKey>> = {
  top: "cube",
  work: "modules",
  "vr-ar": "ring",
  experience: "pipeline",
  writing: "grid",
  skills: "grid",
  about: "cluster",
  contact: "settled",
};

// Must match the poster (src/lib/cube.ts): one unit is a quarter of the hero visual's width.
const VIEW_UNITS = 4;
// The fixed layer starts this far left of the hero visual, so the cube's corners never clip.
const LAYER_MARGIN = 24;
// Clear space between marked text (or the viewport edge) and the companion.
const GAP = 32;
// Outside the hero, the companion is at most this share of the hero cube's size.
const DOCK_SCALE = 0.8;
// Below this share it would be too small to read, so it shrinks away instead.
const MIN_FIT = 0.45;
// Each move spans half the viewport height of scroll, centred where the next section's top crosses
// the middle of the viewport.
const ZONE = 0.5;

export type Stop = {
  layout: LayoutKey;
  /** Scroll position at which the move into this stop is half done (unused for the first). */
  at: number;
  /** Companion centre in layer px. */
  x: number;
  y: number;
  /** Size relative to the hero cube; 0 hides it. */
  scale: number;
};

export type BuildMap = {
  stops: Stop[];
  /** Scroll distance of each move, in px. */
  zone: number;
  /** Fixed layer's left edge, viewport px. */
  layerLeft: number;
  /** Px per unit, matching the hero cube. */
  zoom: number;
};

/**
 * Right edge of the text inside `element`, viewport px. Text nodes only: a range over a whole element
 * also counts the full-width boxes of its block children (a row of buttons, a paragraph).
 */
function textRight(element: Element, range: Range): number {
  let right = 0;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    range.selectNodeContents(node);
    right = Math.max(right, range.getBoundingClientRect().right);
  }
  return right;
}

function clearRight(section: Element): number {
  const range = document.createRange();
  let right = 0;
  section.querySelectorAll("[data-build-clear]").forEach((element) => {
    right = Math.max(right, textRight(element, range));
  });
  return right;
}

export function measureBuild(hero: HTMLElement): BuildMap {
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const heroRect = hero.getBoundingClientRect();
  const layerLeft = Math.max(0, heroRect.left - LAYER_MARGIN);
  const zoom = heroRect.width / VIEW_UNITS;
  const zone = viewportHeight * ZONE;
  const headerBottom = Math.max(0, document.querySelector("header")?.getBoundingClientRect().bottom ?? 0);
  const dockY = (headerBottom + viewportHeight) / 2;

  const stops: (Stop & { clear: number })[] = [];
  let layout: LayoutKey = "cube";
  document.querySelectorAll<HTMLElement>("main section[id]").forEach((section) => {
    layout = LAYOUT_BY_SECTION[section.id] ?? layout;
    const clear = clearRight(section);
    const previous = stops.at(-1);
    if (previous?.layout === layout) {
      previous.clear = Math.max(previous.clear, clear);
      return;
    }
    if (!previous) {
      // The hero: exactly where the cube sits at scroll 0, at full size.
      stops.push({
        layout,
        at: 0,
        x: heroRect.left + heroRect.width / 2 - layerLeft,
        y: heroRect.top + scrollY + heroRect.height / 2,
        scale: 1,
        clear: 0,
      });
      return;
    }
    stops.push({
      layout,
      at: section.getBoundingClientRect().top + scrollY - viewportHeight / 2,
      x: 0,
      y: dockY,
      scale: 0,
      clear,
    });
  });

  // Centre each docked layout in the free space right of its section's marked text, scaled to fit.
  for (const stop of stops.slice(1)) {
    const left = Math.max(layerLeft, stop.clear + GAP);
    const right = viewportWidth - GAP;
    const fit = (right - left) / (LAYOUT_WIDTH[stop.layout] * zoom);
    stop.x = (left + right) / 2 - layerLeft;
    stop.scale = fit < MIN_FIT ? 0 : Math.min(DOCK_SCALE, fit);
  }

  // The last move must finish by the bottom of the page, and moves never overlap.
  const maxScroll = document.documentElement.scrollHeight - viewportHeight;
  for (let i = stops.length - 1; i >= 1; i--) {
    const limit = i === stops.length - 1 ? maxScroll - zone / 2 : stops[i + 1].at - zone;
    stops[i].at = Math.min(stops[i].at, limit);
  }

  return { stops, zone, layerLeft, zoom };
}

/** Continuous progress through the stops: 1.5 means halfway from stop 1 to stop 2. */
export function buildProgress(scrollY: number, { stops, zone }: BuildMap): number {
  let progress = 0;
  for (let i = 1; i < stops.length; i++) {
    const t = MathUtils.clamp((scrollY - (stops[i].at - zone / 2)) / zone, 0, 1);
    if (t === 0) break;
    progress = i - 1 + t;
  }
  return progress;
}
