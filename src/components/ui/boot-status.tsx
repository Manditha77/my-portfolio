"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { BOOT, bootState, subscribeBoot } from "@/lib/boot";

/*
 * The hero status line's part in the cube boot (src/lib/boot.ts). While the cube grows at the viewport
 * centre, its caption (the part counter, server-rendered and revealed by CSS on the boot's timings, so it
 * needs no hydration) sits under it; the pill carrying it then glides into place (globals.css). When the
 * boot ends on its own, the status types itself out once; a skipped boot, a return visit and Motion off
 * show the status as it is.
 * The real status text is always in the DOM and sizes the box; the caption and the typed copy are an
 * aria-hidden overlay on top of it, so assistive tech reads the status once and nothing shifts. The caret is
 * positioned out of flow and moved with a transform, so typing never counts as a layout shift.
 */

type BootStatusProps = {
  status: string;
  /** The boot's centre caption (aria-hidden with the rest of the overlay). */
  caption: ReactNode;
};

export function BootStatus({ status, caption }: BootStatusProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const overlay = overlayRef.current;
    const text = textRef.current;
    const caret = caretRef.current;
    // Types only if this page is mid-boot now: hydrating after it ended leaves the status as it is.
    if (!root || !overlay || !text || !caret || bootState() !== "play") return;

    // Puts the caret just after the last typed character, on whichever line it wrapped to.
    const range = document.createRange();
    const placeCaret = () => {
      const node = text.firstChild;
      const length = node?.textContent?.length ?? 0;
      if (!node || length === 0) return;
      range.setStart(node, length - 1);
      range.setEnd(node, length);
      const rects = range.getClientRects();
      const char = rects[rects.length - 1];
      if (!char) return;
      const origin = overlay.getBoundingClientRect();
      caret.style.transform = `translate(${char.right - origin.left + 1}px, ${char.top - origin.top}px)`;
    };

    let frame = 0;
    let elapsed = 0;
    let last: number | null = null;

    const finish = () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      text.textContent = "";
      caret.hidden = true;
      root.dataset.status = "done";
    };

    // Only visible time counts: a hidden tab runs no frames, and the clock picks up where it left off.
    const tick = (now: number) => {
      elapsed += last === null ? 0 : Math.min(now - last, 100);
      last = now;
      const chars = Math.min(status.length, Math.floor(elapsed / BOOT.typeChar) + 1);
      if (chars >= status.length && elapsed >= status.length * BOOT.typeChar) {
        finish();
        return;
      }
      // Direct DOM writes: no React re-render per character.
      const copy = status.slice(0, chars);
      if (text.textContent !== copy) {
        text.textContent = copy;
        placeCaret();
      }
      frame = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      last = null;
    };

    // Fired synchronously as the boot ends, so the real text is hidden again before the next paint.
    const onBoot = () => {
      unsubscribe();
      if (bootState() !== "end") return;
      root.dataset.status = "typing";
      caret.hidden = false;
      document.addEventListener("visibilitychange", onVisibility);
      frame = requestAnimationFrame(tick);
    };
    const unsubscribe = subscribeBoot(onBoot);

    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [status]);

  return (
    <span ref={rootRef} data-status="idle" className="relative">
      <span data-status-real="">{status}</span>
      <span ref={overlayRef} aria-hidden="true" className="absolute inset-0">
        {caption}
        <span ref={textRef} />
        <span ref={caretRef} hidden className="absolute top-0 left-0 animate-caret text-accent">
          ▍
        </span>
      </span>
    </span>
  );
}
