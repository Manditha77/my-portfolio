"use client";

import type { ReactNode } from "react";
import type { Variants } from "motion/react";
import { LazyMotion } from "motion/react";
// The per-element entry point keeps the full `motion` component (drag, layout, etc.) out of the bundle.
import * as m from "motion/react-m";

const loadFeatures = () => import("./reveal-features").then((mod) => mod.default);

// Named variants, so StaggerList/StaggerItem inside inherit "hidden" → "visible" from this one trigger.
const variants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut", delayChildren: 0.1 },
  },
};

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
        variants={variants}
        initial="hidden"
        whileInView="visible"
        // A margin rather than an `amount`, so sections taller than a phone screen still trigger.
        viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
