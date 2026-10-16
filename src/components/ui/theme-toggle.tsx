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
      className="inline-flex size-11 items-center justify-center rounded-md text-text-muted transition-colors duration-150 ease-out hover:text-text"
    >
      {/* Both icons and labels render; CSS shows the pair for the theme you'd switch to (no hydration mismatch). */}
      <SunIcon className="light:hidden" />
      <MoonIcon className="hidden light:block" />
      <span className="sr-only light:hidden">{shellCopy.switchToLight}</span>
      <span className="hidden light:sr-only">{shellCopy.switchToDark}</span>
    </button>
  );
}
