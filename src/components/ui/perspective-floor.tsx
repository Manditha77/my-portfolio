import { HeroReticle } from "./hero-reticle";

/**
 * The home page's one background surface: a faint accent grid receding to a horizon, whose lines come
 * towards the viewer as the page scrolls (SCAN: an AR ground plane). It brightens in VR/AR, where one scan
 * sweep runs along it, and the hero's ring reticle sits on it. All CSS (.floor in globals.css, on scroll
 * and view timelines) except the reticle. Shown on large screens with a fine pointer and motion on only.
 */
export function PerspectiveFloor() {
  return (
    <div aria-hidden="true" className="floor">
      <div className="floor-surface">
        <div className="floor-view">
          <div className="floor-plane" />
          <div className="floor-sweep" />
        </div>
      </div>
      <HeroReticle />
    </div>
  );
}
