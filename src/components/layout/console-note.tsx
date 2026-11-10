"use client";

import { useEffect } from "react";
import { site } from "@/content/site";
import { brand } from "@/lib/brand";

/*
 * A hello for anyone who opens the browser console: one plain console.log, once per page load.
 * No tracking and no network requests. Renders nothing.
 */

// Once per page load (also keeps dev Strict Mode's double effect run to one message).
let logged = false;

export function ConsoleNote() {
  useEffect(() => {
    if (logged) return;
    logged = true;

    const { greeting, line, sourceLabel, emailLabel } = site.consoleNote;
    console.log(
      `%c${greeting}%c ${line}\n\n${sourceLabel} ${site.links.portfolioRepo.href}\n${emailLabel} ${site.email}`,
      `color: ${brand.accent}; font-weight: 600; font-size: 1.1em;`,
      "",
    );
  }, []);

  return null;
}
