/*
 * SCAN (from AR Elemental Arena): the decorative overlay for a card. Render it as the last child of
 * a `relative` element that carries data-scan. It holds the one-time scan line (played by ScanObserver)
 * and the AR tracking corners shown on hover and keyboard focus. Styles live in globals.css.
 * Absolutely positioned and aria-hidden, so it never changes layout or what assistive tech reads.
 * It covers the host's border box (-inset-px), so the corners sit at a set distance from a 1px border.
 */
export function ScanFrame() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute -inset-px rounded-[inherit]">
      <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <span className="scan-line" />
      </span>
      <span className="scan-corners" />
    </span>
  );
}
