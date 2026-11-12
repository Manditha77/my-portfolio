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

/** ASSEMBLE's piston (--ease-piston): a short ease-out that overshoots a little, then snaps back. */
export const easePiston = [0.3, 1.5, 0.5, 1] as const;

/**
 * A CSS cubic-bezier(x1, y1, x2, y2) as a function of time (0..1), for script-driven motion that must
 * match a CSS animation frame for frame (the cube boot's 3D growth).
 */
export function cubicBezier([x1, y1, x2, y2]: readonly [number, number, number, number]): (t: number) => number {
  const curve = (a: number, b: number, s: number) => 3 * (1 - s) ** 2 * s * a + 3 * (1 - s) * s ** 2 * b + s ** 3;
  const slope = (a: number, b: number, s: number) => 3 * (1 - s) ** 2 * a + 6 * (1 - s) * s * (b - a) + 3 * s ** 2 * (1 - b);
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    // Newton's method for the curve parameter at time t, with bisection as the fallback.
    let s = t;
    for (let i = 0; i < 8; i++) {
      const error = curve(x1, x2, s) - t;
      if (Math.abs(error) < 1e-5) return curve(y1, y2, s);
      const d = slope(x1, x2, s);
      if (Math.abs(d) < 1e-6) break;
      s -= error / d;
    }
    let low = 0;
    let high = 1;
    s = t;
    for (let i = 0; i < 20; i++) {
      if (curve(x1, x2, s) < t) low = s;
      else high = s;
      s = (low + high) / 2;
    }
    return curve(y1, y2, s);
  };
}

/** Milliseconds to seconds, for Motion transitions. */
export const seconds = (ms: number) => ms / 1000;
