import { SHAPE_BY_SECTION } from "@/lib/build-sections";
import type { ShapeKey } from "@/lib/build-shapes";
import { shapeSize } from "./build-poses";

/*
 * "The Build": where each shape forms, and how far the page has scrolled along the path between them.
 * Every section (main section[id], in DOM order, mapped in src/lib/build-sections.ts) gets a free box:
 * the empty space right of its heading and intro, above its cards. As a box scrolls in, blocks stream
 * down into it and assemble its shape; the shape holds while the heading is in view; then its blocks
 * stream down out of the box as it scrolls away, and the next box takes them in. The canvas is only ever
 * drawn inside a stop's band (from its free box to the viewport's right edge, between the box's top and
 * bottom), so it can never sit over text or a card. Everything is measured from the DOM, so it adapts
 * when content changes. Only imported by the lazy 3D chunk.
 *
 * - Text beside a heading that the box must stay clear of carries data-build-clear.
 * - A section's first card block carries data-build-end; the box stops above it. Without one (About,
 *   Contact) the box runs to the end of the section's content.
 */

// One unit is a quarter of the hero visual's width (the cube shape's scale, src/lib/cube.ts, and the portrait's).
export const VIEW_UNITS = 4;
// The hero box reaches this far past the hero visual, so the cube's corners never clip.
const HERO_MARGIN = 24;
// Clear space between the box and text, cards or the previous section's content.
const GAP = 32;
// Inside the box, kept clear on every side.
const PAD = 12;
// Outside the hero, a shape is at most this share of the hero cube's size.
const DOCK_SCALE = 0.8;
// Below this share it would be too small to read, so the section gets no shape instead.
const MIN_FIT = 0.36;

// Scroll knots, as where a stop's centre sits in the viewport (share of its height from the top): the
// blocks stream in and assemble over a long stretch, the shape holds, then streams out as it leaves.
const ENTER_FROM = 0.98;
const FORMED_FROM = 0.55;
const EXIT_FROM = 0.15;
const EXIT_TO = -0.02;
// When sections sit close, a shape may leave early, but holds at least until its centre is here (the hero
// may leave as soon as you scroll); and the next may finish forming late, but by the time it's here.
const EXIT_EARLIEST = 0.3;
const FORMED_LATEST = 0.35;

export type Rect = { left: number; top: number; right: number; bottom: number };

export type Stop = {
  shape: ShapeKey;
  /** Free box, document px. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Centre of the free box, document px. */
  x: number;
  y: number;
  /** Full size relative to the hero cube. */
  scale: number;
  /** Where the canvas may draw while this stop shows: the box's band, out to the viewport's edge. */
  safe: Rect;
  /** Scroll positions: blocks stream in from enter[0] to enter[1], and out from exit[0] to exit[1]. */
  enter: [number, number];
  exit: [number, number];
};

export type BuildMap = {
  stops: Stop[];
  /** Px per unit, matching the hero cube. */
  zoom: number;
  /** Size of the canvas inside the clipped box: the largest safe area, so moving never reallocates it. */
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

/** Moves both ends of a scroll range by `by`. */
function shift(range: [number, number], by: number) {
  range[0] += by;
  range[1] += by;
}

/**
 * Settles the stops' scroll knots. There is one set of blocks, so a shape has streamed out before the
 * next streams in. When sections sit close: first the shape leaves earlier (down to EXIT_EARLIEST; the
 * hero from the top of the page), then the next one forms later (up to FORMED_LATEST), each keeping its
 * full, unhurried length; only if that still isn't enough do the two share the scroll in proportion. The
 * last shape stays, and nothing runs backwards.
 */
function fitKnots(stops: Stop[], viewportHeight: number) {
  const maxScroll = document.documentElement.scrollHeight - viewportHeight;
  const last = stops.at(-1);
  if (last && stops.length > 1) {
    // The last shape stays at the end of the page, fully formed by the time you reach the bottom.
    last.exit = [Infinity, Infinity];
    last.enter[1] = Math.min(last.enter[1], maxScroll);
    last.enter[0] = Math.min(last.enter[0], last.enter[1]);
  }

  for (let i = 1; i < stops.length; i++) {
    const before = stops[i - 1];
    const stop = stops[i];
    const overlap = () => before.exit[1] - stop.enter[0];
    if (overlap() <= 0) continue;

    const earliest = i === 1 ? 0 : Math.max(before.enter[1], before.y - EXIT_EARLIEST * viewportHeight);
    shift(before.exit, -Math.min(overlap(), Math.max(0, before.exit[0] - earliest)));
    if (overlap() <= 0) continue;

    const latest = Math.min(stop.y - FORMED_LATEST * viewportHeight, stop === last ? maxScroll : Infinity);
    shift(stop.enter, Math.min(overlap(), Math.max(0, latest - stop.enter[1])));
    if (overlap() <= 0) continue;

    const exit = before.exit[1] - before.exit[0];
    const enter = stop.enter[1] - stop.enter[0];
    const share = Math.max(0, stop.enter[1] - before.exit[0]) / (exit + enter);
    before.exit[1] = before.exit[0] + exit * share;
    stop.enter[0] = before.exit[1];
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
}

export function measureBuild(hero: HTMLElement): BuildMap {
  const viewportHeight = window.innerHeight;
  // Without the scrollbar: nothing may reach past it (no horizontal scroll).
  const viewWidth = document.documentElement.clientWidth;
  const heroRect = hero.getBoundingClientRect();
  const zoom = heroRect.width / VIEW_UNITS;
  // Every box shares the hero visual's column, so the shapes line up down the page; its right edge is
  // the content's right edge.
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
      // The hero: exactly where the cube sits at scroll 0, at full size, already formed.
      const top = pageTop(hero) - HERO_MARGIN;
      const left = columnLeft - HERO_MARGIN;
      const width = heroRect.width + 2 * HERO_MARGIN;
      const height = hero.offsetHeight + 2 * HERO_MARGIN;
      const y = top + height / 2;
      const exitFrom = Math.max(0, y - EXIT_FROM * viewportHeight);
      stops.push({
        shape,
        left,
        top,
        width,
        height,
        x: left + width / 2,
        y,
        scale: 1,
        safe: { left, top, right: viewWidth, bottom: top + height },
        enter: [-Infinity, -Infinity],
        exit: [exitFrom, exitFrom + (EXIT_FROM - EXIT_TO) * viewportHeight],
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

    // The shape (with room for its live actions) fits the box.
    const size = shapeSize(shape);
    const fit = Math.min((width - 2 * PAD) / (size.width * zoom), (height - 2 * PAD) / (size.height * zoom));
    if (fit < MIN_FIT) return;

    const y = top + height / 2;
    stops.push({
      shape,
      left,
      top,
      width,
      height,
      x: left + width / 2,
      y,
      scale: Math.min(DOCK_SCALE, fit),
      safe: { left, top, right: viewWidth, bottom },
      enter: [y - ENTER_FROM * viewportHeight, y - FORMED_FROM * viewportHeight],
      exit: [y - EXIT_FROM * viewportHeight, y - EXIT_TO * viewportHeight],
    });
  });

  fitKnots(stops, viewportHeight);

  return {
    stops,
    zoom,
    canvasWidth: Math.ceil(Math.max(0, ...stops.map((stop) => stop.safe.right - stop.safe.left))),
    canvasHeight: Math.ceil(Math.max(0, ...stops.map((stop) => stop.height))),
  };
}

/** How far scrollY is through from..to, 0..1. An empty or unbounded range is a step at its end. */
function along(scrollY: number, [from, to]: [number, number]): number {
  if (to > from && Number.isFinite(to - from)) return Math.min(1, Math.max(0, (scrollY - from) / (to - from)));
  return scrollY >= to ? 1 : 0;
}

/** Phases of each stop, as quarters of its progress. */
export const ENTERING = 0;
export const FORMED = 1;
export const EXITING = 2;
export const BETWEEN = 3;

/**
 * Continuous progress along the path. The whole part is the stop; the fraction is in quarters:
 * entering (blocks stream in and assemble), formed, exiting (they stream out), then between this stop
 * and the next, where nothing shows.
 */
export function buildProgress(scrollY: number, { stops }: BuildMap): number {
  for (let i = 0; i < stops.length; i++) {
    const { enter, exit } = stops[i];
    const next = stops[i + 1];
    if (scrollY < enter[1]) return i + 0.25 * along(scrollY, enter);
    if (scrollY < exit[0]) return i + 0.25 + 0.25 * along(scrollY, [enter[1], exit[0]]);
    if (scrollY < exit[1]) return i + 0.5 + 0.25 * along(scrollY, exit);
    if (next && scrollY < next.enter[0]) return i + 0.75 + 0.25 * along(scrollY, [exit[1], next.enter[0]]);
  }
  // Only the hero: it has left for good.
  return stops.length - 0.25;
}
