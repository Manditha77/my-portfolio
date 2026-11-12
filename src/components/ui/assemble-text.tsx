"use client";

import type { Variants } from "motion/react";
import * as m from "motion/react-m";
import { duration, easeOut, seconds } from "@/lib/motion-tokens";

/*
 * ASSEMBLE (from the hero cube, "systems from parts"): the text snaps together character by character.
 * Must sit inside a Reveal: it inherits Reveal's "hidden" → "visible" trigger, so it plays once on entering view.
 * Characters carry data-reveal, so with motion off or without JS they simply show (globals.css).
 * Decorative only: the caller keeps it aria-hidden, and the real heading text lives elsewhere.
 */

const lineVariants: Variants = {
  visible: { transition: { staggerChildren: 0.025 } },
};

const charVariants: Variants = {
  hidden: { opacity: 0, y: "-0.45em" },
  visible: { opacity: 1, y: 0, transition: { duration: seconds(duration.fast), ease: easeOut } },
};

type AssembleTextProps = {
  text: string;
  className?: string;
};

export function AssembleText({ text, className }: AssembleTextProps) {
  return (
    <m.p aria-hidden="true" className={className} variants={lineVariants}>
      {Array.from(text).map((char, index) => (
        <m.span
          // Characters repeat ("0", " "), so the position is the identity.
          key={index}
          data-reveal=""
          className="inline-block whitespace-pre"
          variants={charVariants}
        >
          {char}
        </m.span>
      ))}
    </m.p>
  );
}
