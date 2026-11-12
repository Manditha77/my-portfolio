/*
 * The site's motion tokens for script-driven animation (Motion variants, WAAPI). CSS reads the same
 * values from the --dur-* and --ease-* variables in app/globals.css: keep the two in sync.
 */

/** Durations in ms. */
export const duration = {
  /** Hover and focus: colours, borders, small nudges. */
  fast: 150,
  /** Card borders, menus, small fades. */
  base: 200,
  /** Reveal-on-scroll, staggered items, mark fades. */
  medium: 300,
  /** Entrances and hand-offs. */
  slow: 400,
  /** Delay before a SCAN sweep starts. */
  sweepDelay: 250,
} as const;

/** The site's one ease-out curve (--ease-out). */
export const easeOut = [0, 0, 0.2, 1] as const;

/** --ease-out for WAAPI and inline styles. */
export const easeOutCss = `cubic-bezier(${easeOut.join(", ")})`;

/** Milliseconds to seconds, for Motion transitions. */
export const seconds = (ms: number) => ms / 1000;
