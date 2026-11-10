"use client";

import { useEffect, useRef, useState } from "react";
import { currentMotion, subscribeMotion } from "@/lib/motion-pref";

/*
 * A measured number that counts up once when it enters view (PIPELINE: check, then resolve).
 * The final value is real text from the server render: it sizes the box and is what screen readers
 * and search engines read. While counting it is only made transparent, and an aria-hidden overlay
 * shows the running value. Motion off, or a hidden tab, means it simply stays at the final value.
 */

const DURATION_MS = 700;

type CountUpProps = {
  /** The exact final text, e.g. "334", "0.78", "42%". */
  value: string;
};

function parse(value: string) {
  const match = /^(\d+(?:\.(\d+))?)(.*)$/.exec(value);
  if (!match) return null;
  return { target: Number(match[1]), decimals: match[2]?.length ?? 0, suffix: match[3] };
}

export function CountUp({ value }: CountUpProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const parsed = parse(value);
    if (!root || !parsed || currentMotion() === "off") return;

    let frame = 0;
    const stop = () => {
      cancelAnimationFrame(frame);
      setCounting(false);
    };

    const run = () => {
      setCounting(true);
      let start: number | null = null;
      const tick = (now: number) => {
        start ??= now;
        const progress = Math.min((now - start) / DURATION_MS, 1);
        const eased = 1 - (1 - progress) ** 3;
        const overlay = overlayRef.current;
        if (overlay) overlay.textContent = `${(parsed.target * eased).toFixed(parsed.decimals)}${parsed.suffix}`;
        if (progress < 1) frame = requestAnimationFrame(tick);
        else stop();
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // Never start in a background tab; the final value is already showing.
        if (!document.hidden && currentMotion() === "on") run();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(root);
    const unsubscribe = subscribeMotion(() => {
      if (currentMotion() === "off") stop();
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      unsubscribe();
    };
  }, [value]);

  return (
    <span ref={rootRef} className="relative whitespace-nowrap tabular-nums">
      <span className={counting ? "opacity-0" : undefined}>{value}</span>
      {counting && <span ref={overlayRef} aria-hidden="true" className="absolute inset-0" />}
    </span>
  );
}
