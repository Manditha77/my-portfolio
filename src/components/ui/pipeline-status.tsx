"use client";

import { useEffect, useRef, useState } from "react";
import { currentMotion, subscribeMotion } from "@/lib/motion-pref";

/*
 * PIPELINE (from PPCH's Sense → Analyze → Act): the hero status line first ticks through its steps,
 * then types itself out once. The real status text is always in the DOM and sizes the box; the
 * animated copy is an aria-hidden overlay on top of it, so assistive tech reads the status once and
 * nothing shifts. Plays once per page load, only with site motion on, paused while off-screen or
 * while the tab is hidden. Not the LCP element: the h1 and intro never wait for it.
 */

const STEP_MS = 250;
const CHECK_AT_MS = 140; // within a step: the label shows first, then its tick
const HOLD_MS = 450;
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
    const text = textRef.current;
    const caret = caretRef.current;
    if (!root || !text || !caret) return;

    const stepsEnd = steps.length * STEP_MS;
    const typeStart = stepsEnd + HOLD_MS;
    const total = typeStart + status.length * CHAR_MS;

    const frameAt = (elapsed: number): { copy: string; typing: boolean } => {
      if (elapsed < typeStart) {
        const parts: string[] = [];
        steps.forEach((step, index) => {
          const start = index * STEP_MS;
          if (elapsed >= start) parts.push(elapsed >= start + CHECK_AT_MS ? `${step} ${CHECK}` : step);
        });
        return { copy: parts.join(SEPARATOR), typing: false };
      }
      const chars = Math.min(status.length, Math.floor((elapsed - typeStart) / CHAR_MS) + 1);
      return { copy: status.slice(0, chars), typing: true };
    };

    let elapsed = 0;
    let last: number | null = null;
    let onScreen = true;
    let frame = 0;

    // Marked played on finish (not start), so dev Strict Mode's double effect run still plays it.
    const finish = () => {
      cancelAnimationFrame(frame);
      played = true;
      setDone(true);
    };

    const tick = (now: number) => {
      // Accumulate only visible time, so the sequence pauses off-screen and in hidden tabs.
      const delta = last === null ? 0 : Math.min(now - last, 100);
      last = now;
      if (onScreen && !document.hidden) elapsed += delta;

      if (elapsed >= total) {
        finish();
        return;
      }
      const { copy, typing } = frameAt(elapsed);
      // Direct DOM writes: no React re-render per character.
      if (text.textContent !== copy) text.textContent = copy;
      caret.hidden = !typing;
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    observer.observe(root);
    const unsubscribe = subscribeMotion(() => {
      if (currentMotion() === "off") finish();
    });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      unsubscribe();
    };
  }, [done, status, steps]);

  return (
    <span ref={rootRef} data-pipeline={done ? "done" : "pending"} className="relative">
      <span data-pipeline-real="">{status}</span>
      {!done && (
        <span aria-hidden="true" className="absolute inset-0">
          <span ref={textRef} />
          <span ref={caretRef} hidden className="ml-px animate-caret text-accent">
            ▍
          </span>
        </span>
      )}
    </span>
  );
}
