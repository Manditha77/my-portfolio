"use client";

import { useLayoutEffect } from "react";
import { shellCopy } from "@/content/navigation";
import { applyTheme, LIGHT_QUERY, readStoredTheme, storeTheme, systemTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  useLayoutEffect(() => {
    // Re-apply after React's dev Strict Mode remount clears <html> attributes. No-op in production.
    applyTheme(readStoredTheme() ?? systemTheme());

    // With no stored choice, follow live OS theme changes.
    const media = window.matchMedia(LIGHT_QUERY);
    const onChange = () => {
      if (readStoredTheme() === null) applyTheme(systemTheme());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    storeTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={shellCopy.toggleTheme}
      className="inline-flex size-11 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text"
    >
      {/* Both icons render; CSS shows the one for the theme you'd switch to. */}
      <SunIcon className="light:hidden" />
      <MoonIcon className="hidden light:block" />
    </button>
  );
}
