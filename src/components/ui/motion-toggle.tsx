"use client";

import { shellCopy } from "@/content/navigation";
import { applyMotion, currentMotion, storeMotion } from "@/lib/motion-pref";
import { useMotionOn } from "@/lib/use-motion-on";
import { PauseIcon, PlayIcon } from "./icons";

/**
 * Site-wide motion switch. A toggle button with a fixed name ("Pause animations"); aria-pressed=true
 * means paused. The default comes from prefers-reduced-motion; an explicit click wins and is saved.
 */
export function MotionToggle() {
  const motionOn = useMotionOn();

  function toggle() {
    const next = currentMotion() === "on" ? "off" : "on";
    applyMotion(next);
    storeMotion(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      // Server HTML says paused (the store's server value); it corrects itself on mount.
      aria-pressed={!motionOn}
      title={motionOn ? shellCopy.pauseAnimations : shellCopy.playAnimations}
      className="inline-flex size-11 items-center justify-center rounded-md text-text-muted transition-colors duration-150 ease-out hover:text-text"
    >
      {/* Icons follow data-motion in CSS, so the first paint is already right (no hydration flash). */}
      <PauseIcon className="hidden motion-on:block" />
      <PlayIcon className="motion-on:hidden" />
      <span className="sr-only">{shellCopy.pauseAnimations}</span>
    </button>
  );
}
