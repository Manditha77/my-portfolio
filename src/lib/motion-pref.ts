/*
 * The site-wide motion switch: data-motion="on" | "off" on <html>. Set before first paint by
 * motionInitScript (stored choice, else the OS reduce-motion preference), then changed by the
 * Motion toggle. CSS and every effect read this one attribute (React components: useMotionOn in
 * use-motion-on.ts). An explicit choice beats the OS default. No React here: the server-rendered
 * init script imports this file.
 */

export type MotionPref = "on" | "off";

export const MOTION_STORAGE_KEY = "motion";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const CHANGE_EVENT = "motionchange";

export const motionInitScript = `(function(){try{var m=null;try{m=localStorage.getItem("${MOTION_STORAGE_KEY}")}catch(e){}if(m!=="on"&&m!=="off"){m=window.matchMedia("${REDUCE_QUERY}").matches?"off":"on"}document.documentElement.setAttribute("data-motion",m)}catch(e){}})()`;

export function readStoredMotion(): MotionPref | null {
  try {
    const value = localStorage.getItem(MOTION_STORAGE_KEY);
    return value === "on" || value === "off" ? value : null;
  } catch {
    return null;
  }
}

export function storeMotion(pref: MotionPref): void {
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, pref);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
}

export function systemMotion(): MotionPref {
  return window.matchMedia(REDUCE_QUERY).matches ? "off" : "on";
}

export function currentMotion(): MotionPref {
  return document.documentElement.getAttribute("data-motion") === "off" ? "off" : "on";
}

export function applyMotion(pref: MotionPref): void {
  document.documentElement.setAttribute("data-motion", pref);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Calls `onChange` whenever site motion changes (toggle, or OS change with no stored choice). */
export function subscribeMotion(onChange: () => void): () => void {
  // With no stored choice, follow live OS changes too.
  const media = window.matchMedia(REDUCE_QUERY);
  const onSystemChange = () => {
    if (readStoredMotion() === null) applyMotion(systemMotion());
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  media.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    media.removeEventListener("change", onSystemChange);
  };
}
