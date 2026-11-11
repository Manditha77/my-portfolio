import type { ShapeKey } from "@/lib/build-shapes";
import { shapeSize, spinSize } from "./build-poses";

/*
 * "The Build": where the companion goes, and how far the page has scrolled along its path.
 * Every section (main section[id], in DOM order) gets a free box: the empty space right of its heading
 * and intro, above its cards. Between them the companion travels as a small cube in the lane, the outer
 * right margin beside the content. The canvas is only ever drawn inside a safe rectangle for the
 * current phase (a stop's band, from its free box to the viewport's right edge, or the lane), so it can
 * never sit over text or a card. Everything is measured from the DOM, so it adapts when content changes.
 * Only imported by the lazy 3D chunk.
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
const MIN_FIT = 0.36;

// The travelling cube, px across at any turn. It uses the smaller size when the lane is narrower than
// the larger; narrower than that, it waits just off the right edge of the viewport.
const TRAVEL_SIZE = 64;
const TRAVEL_SIZE_NARROW = 56;
// Clear space either side of the lane: from the content's right edge, and from the viewport's.
const LANE_GAP = 16;

// Scroll knots, as where a stop's centre sits in the viewport (share of its height from the top):
// the cube unfolds into the shape, the shape holds, then folds back into the cube.
const UNFOLD_FROM = 0.85;
const FORMED_FROM = 0.62;
const FOLD_FROM = 0.35;
const FOLD_TO = 0.2;
// Scroll left for the travel when sections sit close together, share of the viewport height.
const MIN_TRAVEL = 0.1;

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
  /** Where the canvas may draw while the companion is here: the box's band, out to the viewport's edge. */
  safe: Rect;
  /** Scroll positions: the unfold runs from unfold[0] to unfold[1], the fold from fold[0] to fold[1]. */
  unfold: [number, number];
  fold: [number, number];
};

export type Lane = {
  /** Centre line of the travelling cube, document px (past the viewport's right edge when it doesn't fit). */
  x: number;
  /** The travelling cube's size relative to the hero cube. */
  scale: number;
  /** Where the canvas may draw while the cube travels. */
  safe: Rect;
};

export type BuildMap = {
  stops: Stop[];
  lane: Lane;
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

/** Settles the stops' scroll knots: the last shape stays, close sections share the scroll, nothing runs backwards. */
function fitKnots(stops: Stop[], viewportHeight: number) {
  const last = stops.at(-1);
  if (last && stops.length > 1) {
    // The last shape stays at the end of the page, fully formed by the time you reach the bottom.
    const maxScroll = document.documentElement.scrollHeight - viewportHeight;
    last.fold = [Infinity, Infinity];
    last.unfold[1] = Math.min(last.unfold[1], maxScroll);
    last.unfold[0] = Math.min(last.unfold[0], last.unfold[1]);
  }

  // Close sections: the fold, the travel and the next unfold share the scroll between them in proportion.
  const minTravel = MIN_TRAVEL * viewportHeight;
  for (let i = 1; i < stops.length; i++) {
    const before = stops[i - 1];
    const stop = stops[i];
    if (stop.unfold[0] >= before.fold[1] + minTravel) continue;
    const fold = before.fold[1] - before.fold[0];
    const unfold = stop.unfold[1] - stop.unfold[0];
    const share = Math.max(0, stop.unfold[1] - before.fold[0]) / (fold + minTravel + unfold);
    before.fold[1] = before.fold[0] + fold * share;
    stop.unfold[0] = before.fold[1] + minTravel * share;
  }

  // Knots never run backwards, so the progress below is always well defined.
  let knot = -Infinity;
  for (const stop of stops) {
    for (const range of [stop.unfold, stop.fold]) {
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

  // The lane: the outer right margin, clear of the content and the viewport's edge.
  const laneLeft = columnRight + LANE_GAP;
  const room = viewWidth - LANE_GAP - laneLeft;
  const travelSize = room >= TRAVEL_SIZE ? TRAVEL_SIZE : TRAVEL_SIZE_NARROW;
  const inLane = room >= TRAVEL_SIZE_NARROW;
  const lane: Lane = {
    x: inLane ? laneLeft + room / 2 : viewWidth + travelSize,
    scale: travelSize / (spinSize("cube") * zoom),
    safe: { left: inLane ? laneLeft : viewWidth, top: -Infinity, right: viewWidth, bottom: Infinity },
  };

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
      const left = columnLeft - HERO_MARGIN;
      const width = heroRect.width + 2 * HERO_MARGIN;
      const height = hero.offsetHeight + 2 * HERO_MARGIN;
      const y = top + height / 2;
      const foldFrom = Math.max(0, y - FOLD_FROM * viewportHeight);
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
        unfold: [-Infinity, -Infinity],
        fold: [foldFrom, foldFrom + (FOLD_FROM - FOLD_TO) * viewportHeight],
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

    // The shape (with room for its live actions) fits the box, and the travelling cube fits its band.
    const size = shapeSize(shape);
    const fit = Math.min((width - 2 * PAD) / (size.width * zoom), (height - 2 * PAD) / (size.height * zoom));
    if (fit < MIN_FIT || height < travelSize + 2 * PAD) return;

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
      unfold: [y - UNFOLD_FROM * viewportHeight, y - FORMED_FROM * viewportHeight],
      fold: [y - FOLD_FROM * viewportHeight, y - FOLD_TO * viewportHeight],
    });
  });

  fitKnots(stops, viewportHeight);

  return {
    stops,
    lane,
    zoom,
    canvasWidth: Math.ceil(Math.max(travelSize, ...stops.map((stop) => stop.safe.right - stop.safe.left))),
    canvasHeight: Math.ceil(Math.max(travelSize, ...stops.map((stop) => stop.height))),
  };
}

/** How far scrollY is through from..to, 0..1. An empty or unbounded range is a step at its end. */
function along(scrollY: number, [from, to]: [number, number]): number {
  if (to > from && Number.isFinite(to - from)) return Math.min(1, Math.max(0, (scrollY - from) / (to - from)));
  return scrollY >= to ? 1 : 0;
}

/** Phases of each stop, as quarters of its progress. */
export const UNFOLDING = 0;
export const FORMED = 1;
export const FOLDING = 2;
export const TRAVELLING = 3;

/**
 * Continuous progress along the path. The whole part is the stop; the fraction is in quarters:
 * unfolding (the cube in the lane → the shape), formed, folding (back to the cube in the lane), then
 * travelling down the lane to the next stop.
 */
export function buildProgress(scrollY: number, { stops }: BuildMap): number {
  for (let i = 0; i < stops.length; i++) {
    const { unfold, fold } = stops[i];
    const next = stops[i + 1];
    if (scrollY < unfold[1]) return i + 0.25 * along(scrollY, unfold);
    if (scrollY < fold[0]) return i + 0.25 + 0.25 * along(scrollY, [unfold[1], fold[0]]);
    if (scrollY < fold[1]) return i + 0.5 + 0.25 * along(scrollY, fold);
    if (next && scrollY < next.unfold[0]) return i + 0.75 + 0.25 * along(scrollY, [fold[1], next.unfold[0]]);
  }
  // Only the hero: it stays in the lane once folded.
  return stops.length - 0.25;
}
