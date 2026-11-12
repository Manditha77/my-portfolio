"use client";

import { useEffect, useRef, useState } from "react";
import { SEQUENCE, SEQUENCE_STEPS, pauseSequence, readSequence } from "@/lib/hero-sequence";
import { currentMotion, subscribeMotion } from "@/lib/motion-pref";

/*
 * PIPELINE (from PPCH's Sense → Analyze → Act): the hero status line ticks through its steps in step with
 * the poster's first-load build sequence (src/lib/hero-sequence.ts: each step shows as its stage starts
 * and gets its tick as it ends), then types itself out once. It follows the sequence's CSS clock, so a late
 * hydration just picks up at the current step, and it conducts the pause: while the hero is off screen or
 * the tab is hidden, the whole sequence (the poster, this line and the 3D cube) holds still.
 * The real status text is always in the DOM and sizes the box; the animated copy is an aria-hidden overlay
 * on top of it, so assistive tech reads the status once and nothing shifts. The caret is positioned out of
 * flow and moved with a transform, so typing never counts as a layout shift. Plays once per page load,
 * only with site motion on. Not the LCP element: the h1 and intro never wait for it.
 */

const CHAR_MS = 35;
const CHECK = "✓";
const SEPARATOR = " · ";

// Once per page load, even if the hero remounts after client-side navigation.
let played = false;

type PipelineStatusProps = {
  status: string;
  steps: readonly string[];
};

export function PipelineStatus({ status, steps }: PipelineStatusProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  // A remount after client-side navigation starts finished (played is false during the first hydration).
  const [done, setDone] = useState(() => played);

  useEffect(() => {
    if (done) return;
    if (currentMotion() === "off") {
      // The real text already shows (the CSS only hides it while motion is on); just drop the overlay.
      const skip = requestAnimationFrame(() => setDone(true));
      return () => cancelAnimationFrame(skip);
    }

    const root = rootRef.current;
    const overlay = overlayRef.current;
    const text = textRef.current;
    const caret = caretRef.current;
    if (!root || !overlay || !text || !caret) return;

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

    const typeStart = SEQUENCE.end;
    const total = typeStart + status.length * CHAR_MS;

    const frameAt = (elapsed: number): { copy: string; typing: boolean } => {
      if (elapsed < typeStart) {
        const parts: string[] = [];
        steps.forEach((step, index) => {
          const [start, end] = SEQUENCE_STEPS[index] ?? SEQUENCE_STEPS[SEQUENCE_STEPS.length - 1];
          if (elapsed >= start) parts.push(elapsed >= end ? `${step} ${CHECK}` : step);
        });
        return { copy: parts.join(SEPARATOR), typing: false };
      }
      const chars = Math.min(status.length, Math.floor((elapsed - typeStart) / CHAR_MS) + 1);
      return { copy: status.slice(0, chars), typing: true };
    };

    let elapsed = 0;
    let last: number | null = null;
    let onScreen = true;
    let paused = false;
    let frame = 0;

    // Marked played on finish (not start), so dev Strict Mode's double effect run still plays it.
    const finish = () => {
      cancelAnimationFrame(frame);
      pauseSequence(false);
      played = true;
      setDone(true);
    };

    // Called from the observer and on tab visibility, not per frame: a hidden tab runs no frames.
    const updatePause = () => {
      const hide = !onScreen || document.hidden;
      if (hide === paused) return;
      paused = hide;
      pauseSequence(paused);
    };

    const tick = (now: number) => {
      // The build sequence's clock while it runs; after it, only visible time counts (typing pauses too).
      const delta = last === null ? 0 : Math.min(now - last, 100);
      last = now;
      const time = elapsed < typeStart ? readSequence().time : Infinity;
      if (Number.isFinite(time)) elapsed = time;
      else if (elapsed < typeStart) elapsed = typeStart;
      else if (!paused) elapsed += delta;

      if (elapsed >= total) {
        finish();
        return;
      }
      const { copy, typing } = frameAt(elapsed);
      // Direct DOM writes: no React re-render per character.
      if (text.textContent !== copy) {
        text.textContent = copy;
        if (typing) placeCaret();
      }
      caret.hidden = !typing;
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      updatePause();
    });
    // The whole hero: on phones the poster sits below the status line.
    observer.observe(root.closest("section") ?? root);
    const unsubscribe = subscribeMotion(() => {
      if (currentMotion() === "off") finish();
    });
    document.addEventListener("visibilitychange", updatePause);
    updatePause();
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      pauseSequence(false);
      observer.disconnect();
      document.removeEventListener("visibilitychange", updatePause);
      unsubscribe();
    };
  }, [done, status, steps]);

  return (
    <span ref={rootRef} data-pipeline={done ? "done" : "pending"} className="relative">
      <span data-pipeline-real="">{status}</span>
      {!done && (
        <span ref={overlayRef} aria-hidden="true" className="absolute inset-0">
          <span ref={textRef} />
          <span ref={caretRef} hidden className="absolute top-0 left-0 animate-caret text-accent">
            ▍
          </span>
        </span>
      )}
    </span>
  );
}
