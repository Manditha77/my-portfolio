"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SectionId } from "@/content/navigation";
import { homeSectionIds } from "@/content/navigation";

const LAST_SECTION: SectionId = "contact";

/**
 * The home section currently in view, for highlighting the nav. IntersectionObserver only (no scroll
 * listeners): a section is active while it crosses a thin band at mid-viewport. The last section is
 * short and may never reach that band, so it also wins whenever it is fully in view.
 * Returns null off the home page, and over the hero.
 */
export function useActiveSection(): SectionId | null {
  const pathname = usePathname();
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    if (pathname !== "/" || typeof IntersectionObserver === "undefined") return;

    const sections = homeSectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    let banded: SectionId | null = null;
    let lastFullyVisible = false;
    const update = () => setActive(lastFullyVisible ? LAST_SECTION : banded);

    const band = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as SectionId;
          if (entry.isIntersecting) banded = id;
          else if (banded === id) banded = null;
        }
        update();
      },
      { rootMargin: "-45% 0px -55% 0px" },
    );
    const last = new IntersectionObserver(
      ([entry]) => {
        lastFullyVisible = entry.intersectionRatio >= 0.99;
        update();
      },
      { threshold: [0, 0.99] },
    );

    sections.forEach((section) => band.observe(section));
    const lastSection = document.getElementById(LAST_SECTION);
    if (lastSection) last.observe(lastSection);

    return () => {
      band.disconnect();
      last.disconnect();
      setActive(null);
    };
  }, [pathname]);

  return active;
}
