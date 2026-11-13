"use client";

import { useState } from "react";
import { shellCopy } from "@/content/navigation";
import { applyMotion, currentMotion, storeMotion } from "@/lib/motion-pref";
import { PauseIcon, PlayIcon } from "./icons";

/**
 * Site-wide motion switch. Its name says what a press does ("Pause animations" / "Play animations"), so it
 * has no aria-pressed; a visible tooltip under it shows the same words on hover and keyboard focus (Escape
 * hides it until the pointer leaves or focus moves). The default comes from prefers-reduced-motion; an
 * explicit click wins and is saved.
 */
export function MotionToggle() {
  const [tipHidden, setTipHidden] = useState(false);

  function toggle() {
    const next = currentMotion() === "on" ? "off" : "on";
    applyMotion(next);
    storeMotion(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === "Escape") setTipHidden(true);
      }}
      onBlur={() => setTipHidden(false)}
      onPointerLeave={() => setTipHidden(false)}
      className="group relative inline-flex size-11 items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-out hover:text-text"
    >
      {/* Icons and labels follow data-motion in CSS, so the first paint is already right (no hydration flash). */}
      <PauseIcon className="hidden motion-on:block" />
      <PlayIcon className="motion-on:hidden" />
      <span className="hidden motion-on:sr-only">{shellCopy.pauseAnimations}</span>
      <span className="sr-only motion-on:hidden">{shellCopy.playAnimations}</span>

      {/* The same words, shown. Right-aligned under the button so it never leaves the viewport; the padding
          bridges the gap, so moving onto it keeps it open. */}
      {!tipHidden && (
        <span
          aria-hidden="true"
          className="invisible absolute top-full right-0 z-10 pt-1.5 opacity-0 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 motion-on:transition-[opacity,visibility] motion-on:duration-fast motion-on:ease-out"
        >
          <span className="block rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs whitespace-nowrap text-text light:shadow-card">
            <span className="hidden motion-on:inline">{shellCopy.pauseAnimations}</span>
            <span className="motion-on:hidden">{shellCopy.playAnimations}</span>
          </span>
        </span>
      )}
    </button>
  );
}
