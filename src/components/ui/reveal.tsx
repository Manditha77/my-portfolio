"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "motion/react";
// The per-element entry point keeps the full `motion` component (drag, layout, etc.) out of the bundle.
import * as m from "motion/react-m";

const loadFeatures = () => import("./reveal-features").then((mod) => mod.default);

type RevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Fades and lifts its children in once, when they first scroll into view.
 * Reduced motion and no-JS fallbacks live in globals.css ([data-reveal]).
 */
export function Reveal({ children, className }: RevealProps) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <m.div
        data-reveal=""
        className={className}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        // A margin rather than an `amount`, so sections taller than a phone screen still trigger.
        viewport={{ once: true, margin: "0px 0px -15% 0px" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
