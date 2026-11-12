/*
 * Literal dark-theme colours for generated images (Open Graph, icons). Satori renders outside the
 * page, so it can't read the CSS variables. Keep these in sync with `:root` in app/globals.css.
 */
export const brand = {
  bg: "#0b0f14",
  surface: "#121821",
  text: "#e6edf3",
  textMuted: "#9aa7b4",
  border: "#243041",
  accent: "#2dd4bf",
  /* The header mark's voxel faces (--mark-* in globals.css), mixed from the accent in oklab:
     light = 72% accent + white, dark = 58% accent + black, lit = 30% accent + white. */
  markLight: "#80e1d1",
  markMid: "#2dd4bf",
  markDark: "#10645a",
  markLit: "#cef3eb",
} as const;
