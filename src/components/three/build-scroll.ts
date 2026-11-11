import { MathUtils } from "three";
import type { ShapeKey } from "@/lib/build-shapes";
import { shapeSize } from "./build-poses";

/*
 * "The Build": where each home section's shape sits, and how far the page has scrolled through it.
 * Every section (main section[id], in DOM order) gets a free box: the empty space right of its heading
 * and intro, above its cards. The companion only ever draws inside the current box (its canvas is
 * clipped to it), so it can never sit over text or a card. Everything is measured from the DOM, so it
 * adapts when content changes. Only imported by the lazy 3D chunk.
 *
 * - Text beside a heading that the box must stay clear of carries data-build-clear.
 * - A section's first card block carries data-build-end; the box stops above it. Without one (About,
 *   Contact) the box runs to the end of the section's content.
 */

/** Sections not listed get no shape. */
export const SHAPE_BY_SECTION: Readonly<Record<string, ShapeKey>> = {
  top: "cube",
  work: "stack",
  "vr-ar": "headset",
  experience: "plane",
  writing: "book",
  skills: "tiles",
  about: "person",
  contact: "envelope",
};

// Must match the poster (src/lib/cube.ts): one unit is a quarter of the hero visual's width.
const VIEW_UNITS = 4;
// The hero box reaches this far past the hero visual, so the cube's corners never clip.
const HERO_MARGIN = 24;
// Clear space between the box and text, cards or the previous section's content.
const GAP = 32;
// Inside the box, kept clear on every side.
const PAD = 12;
// Outside the hero, a shape is at most this share of the hero cube's size.
const DOCK_SCALE = 0.8;
// Below this share it would be too small to read, so the section gets no shape instead.
const MIN_FIT = 0.4;
// Scale while a shape enters (from) and leaves (to), as a share of its full size.
export const EDGE_SCALE = 0.6;

// Scroll knots, as where the box centre sits in the viewport (share of its height from the top).
const ENTER_FROM = 1;
const ENTER_TO = 0.65;
const EXIT_FROM = 0.4;
// When one section's exit would run into the next one's enter, the exit gets this share of the overlap.
const EXIT_SHARE = 0.4;

export type Stop = {
  shape: ShapeKey;
  /** Free box, document px. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Full size relative to the hero cube (fits this shape and, while entering, the previous one). */
  scale: number;
  /** Scroll positions: the enter runs from enter[0] to enter[1], the exit from exit[0] to exit[1]. */
  enter: [number, number];
  exit: [number, number];
};

export type BuildMap = {
  stops: Stop[];
  /** Px per unit, matching the hero cube. */
  zoom: number;
  /** Size of the canvas inside the clipped box: the largest box, so switching boxes never reallocates. */
  canvasWidth: number;
  canvasHeight: number;
};

/** Top of `element` in document px, from layout offsets (ignores the reveal transforms). */
function pageTop(element: HTMLElement): number {
  let top = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
  }
  return top;
}

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

/** Right edge of the data-build-clear text in `section` that overlaps the band top..bottom (document px). */
function clearRight(section: Element, top: number, bottom: number): number {
  const range = document.createRange();
  let right = 0;
  section.querySelectorAll<HTMLElement>("[data-build-clear]").forEach((element) => {
    const elementTop = pageTop(element);
    if (elementTop > bottom || elementTop + element.offsetHeight < top) return;
    right = Math.max(right, textRight(element, range));
  });
  return right;
}

function paddingBottom(element: Element): number {
  return Number.parseFloat(getComputedStyle(element).paddingBottom) || 0;
}

export function measureBuild(hero: HTMLElement): BuildMap {
  const viewportHeight = window.innerHeight;
  const heroRect = hero.getBoundingClientRect();
  const zoom = heroRect.width / VIEW_UNITS;
  const headerBottom = Math.max(0, document.querySelector("header")?.getBoundingClientRect().bottom ?? 0);
  // Every box shares the hero visual's column, so the shapes line up down the page.
  const columnLeft = heroRect.left;
  const columnRight = heroRect.right;

  const stops: Stop[] = [];
  let previous: HTMLElement | null = null;
  document.querySelectorAll<HTMLElement>("main section[id]").forEach((section) => {
    const shape = SHAPE_BY_SECTION[section.id];
    const after = previous;
    previous = section;
    if (!shape) return;

    if (stops.length === 0) {
      // The hero: exactly where the cube sits at scroll 0, at full size.
      const top = pageTop(hero) - HERO_MARGIN;
      const height = hero.offsetHeight + 2 * HERO_MARGIN;
      const centre = top + height / 2;
      stops.push({
        shape,
        left: columnLeft - HERO_MARGIN,
        top,
        width: heroRect.width + 2 * HERO_MARGIN,
        height,
        scale: 1,
        enter: [-Infinity, -Infinity],
        exit: [Math.max(0, centre - EXIT_FROM * viewportHeight), top + height - headerBottom],
      });
      return;
    }

    const sectionTop = pageTop(section);
    const top = (after ? sectionTop - paddingBottom(after) : sectionTop) + GAP;
    const end = section.querySelector<HTMLElement>("[data-build-end]");
    const bottom = (end ? pageTop(end) : sectionTop + section.offsetHeight - paddingBottom(section)) - GAP;
    const left = Math.max(columnLeft, clearRight(section, top, bottom) + GAP);
    const width = columnRight - left;
    const height = bottom - top;

    // Fit this shape, and the one its blocks arrive from, inside the box.
    const from = shapeSize((stops.at(-1) as Stop).shape);
    const to = shapeSize(shape);
    const fit = Math.min(
      (width - 2 * PAD) / (Math.max(from.width, to.width) * zoom),
      (height - 2 * PAD) / (Math.max(from.height, to.height) * zoom),
    );
    if (fit < MIN_FIT) return;

    const centre = top + height / 2;
    stops.push({
      shape,
      left,
      top,
      width,
      height,
      scale: Math.min(DOCK_SCALE, fit),
      enter: [centre - ENTER_FROM * viewportHeight, centre - ENTER_TO * viewportHeight],
      exit: [centre - EXIT_FROM * viewportHeight, bottom + GAP - headerBottom],
    });
  });

  const last = stops.at(-1);
  if (last && stops.length > 1) {
    // The last shape stays at the end of the page, fully formed by the time you reach the bottom.
    const maxScroll = document.documentElement.scrollHeight - viewportHeight;
    last.exit = [Infinity, Infinity];
    last.enter[1] = Math.min(last.enter[1], maxScroll);
    last.enter[0] = Math.min(last.enter[0], last.enter[1]);
  }

  // One shape leaves before the next arrives: an overlapping exit and enter split the scroll between them.
  for (let i = 1; i < stops.length; i++) {
    const before = stops[i - 1];
    const stop = stops[i];
    if (before.exit[1] <= stop.enter[0]) continue;
    const span = Math.max(0, stop.enter[1] - before.exit[0]);
    const meet = before.exit[0] + span * EXIT_SHARE;
    before.exit[1] = meet;
    stop.enter[0] = meet;
  }

  // Knots never run backwards, so the progress below is always well defined.
  let knot = -Infinity;
  for (const stop of stops) {
    for (const range of [stop.enter, stop.exit]) {
      for (const index of [0, 1] as const) {
        range[index] = Math.max(range[index], knot);
        if (Number.isFinite(range[index])) knot = range[index];
      }
    }
  }

  return {
    stops,
    zoom,
    canvasWidth: Math.ceil(Math.max(...stops.map((stop) => stop.width))),
    canvasHeight: Math.ceil(Math.max(...stops.map((stop) => stop.height))),
  };
}

/** How far scrollY is through from..to, 0..1. An empty range is a step at its end. */
function along(scrollY: number, [from, to]: [number, number]): number {
  if (to > from) return MathUtils.clamp((scrollY - from) / (to - from), 0, 1);
  return scrollY >= to ? 1 : 0;
}

/**
 * Continuous progress through the stops. The whole part is the stop; the fraction is its phase:
 * 0 → 0.5 entering (0 = invisible), 0.5 formed, 0.5 → 1 leaving (1 = invisible).
 */
export function buildProgress(scrollY: number, { stops }: BuildMap): number {
  for (let i = 0; i < stops.length; i++) {
    const { enter, exit } = stops[i];
    if (scrollY < enter[1]) return i + 0.5 * along(scrollY, enter);
    if (scrollY < exit[1]) return i + 0.5 + 0.5 * along(scrollY, exit);
  }
  return stops.length;
}
