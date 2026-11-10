"use client";

import type { ReactNode } from "react";
import type { Variants } from "motion/react";
import * as m from "motion/react-m";

/*
 * Staggered list reveal. Must sit inside a Reveal: these have no viewport trigger of their own and
 * inherit its "hidden" → "visible" variants, so each item appears ~60ms after the one before.
 * Items carry data-reveal, so the reduced-motion and no-JS fallbacks in globals.css apply to them too.
 */

const listVariants: Variants = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

type StaggerListProps = {
  as?: "ul" | "ol";
  className?: string;
  role?: string;
  children: ReactNode;
};

export function StaggerList({ as = "ul", className, role, children }: StaggerListProps) {
  const List = as === "ol" ? m.ol : m.ul;
  return (
    <List className={className} role={role} variants={listVariants}>
      {children}
    </List>
  );
}

type StaggerItemProps = {
  className?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
};

export function StaggerItem({ className, children, ...rest }: StaggerItemProps) {
  return (
    <m.li data-reveal="" className={className} variants={itemVariants} {...rest}>
      {children}
    </m.li>
  );
}
