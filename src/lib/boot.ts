/*
 * The cube boot: the home page's opening, once per visit (sessionStorage). ASSEMBLE: the hero cube grows
 * out of a glowing core at the viewport centre (the 6 face blocks, then the 12 edges, then the 8 corners
 * slide out and snap in; src/lib/boot-growth.ts), while a part counter under it counts up to 27. It
 * settles onto the floor as the floor rolls out from under it, then it glides (FLIP) into its hero slot
 * while three blocks detach from it (into the header mark, the status dot and "View my work") and the
 * header and the hero content reveal in reading order; at the end the status types out, the 3D cube takes
 * over and the reticle wakes. On capable desktops a WebGL copy of the growth may take over from the SVG
 * while it plays (src/components/three/boot-growth.tsx).
 * All CSS (globals.css, "Cube boot"), scoped to data-boot="play" on <html>, which only bootInitScript sets,
 * before first paint. So no JS, Motion off, a return visit and back-navigation all show the finished page
 * from the first frame, and ending the intro (any input, the tab hidden, the clock running out) just drops
 * the attribute's value: everything snaps to its resting style, which is the finished page.
 * The states: "play" (running), "end" (finished on its own: the status types out), "skip" (cut short: no
 * typing) and "none" (never played on this page load).
 * Sequencing constants (CLAUDE.md §5), desktop ms. bootTimingCss writes them as CSS variables; phones and
 * tablets play the same story faster (--boot-k), durations included, so nothing outlasts the clock.
 * No React here: the server-rendered init scripts import this file (the hook is in use-boot-state.ts).
 */

export const BOOT = {
  /** The core block appears, glowing. */
  coreAt: 200,
  core: 200,
  /** Each ring of blocks slides out of the blocks already in place, one after another (piston ease). */
  facesAt: 500,
  faceStagger: 25,
  edgesAt: 900,
  edgeStagger: 15,
  cornersAt: 1300,
  cornerStagger: 8,
  slide: 240,
  /** The accent flash as a block snaps in. */
  flash: 180,
  /** The core's glow dims as the corners close it in. */
  coreDimAt: 1300,
  coreDim: 300,
  /** The cube settles onto the floor, and the floor rolls out from under it. */
  settleAt: 1600,
  settle: 200,
  floorAt: 1600,
  floor: 500,
  /** The horizon glow gives way to the floor. */
  stageFadeAt: 2100,
  /** The cube glides to its hero slot; the caption travels to the pill, whose border then draws. */
  glideAt: 2000,
  glide: 950,
  caption: 400,
  borderAt: 2550,
  /** Hero content in reading order, from the glide's start. */
  revealAt: 2000,
  revealStep: 110,
  nameStep: 80,
  nameBeamAt: 2350,
  /** Header: line, block and mark, name, nav links, then the controls. Done by ~2.65 s. */
  headerAt: 2000,
  block: 300,
  markAt: 2300,
  navAt: 2100,
  navStep: 60,
  toolsAt: 2360,
  /** The blocks that fly to the status dot and to "View my work" (landing as the buttons reveal). */
  dotBlock: 350,
  ctaBlock: 330,
  /** Everything below the hero. */
  restAt: 2500,
  /** The clock runs out: "end". Every animation above finishes by now. */
  end: 3000,
  /** Then the status types out (~0.4 s for its 41 characters). */
  typeChar: 10,
} as const;

/** Desktop 3D growth: it may take over from the SVG until this time, and hands back once the cube has settled. */
export const BOOT_3D = {
  takeoverBy: BOOT.cornersAt,
  handBackAt: BOOT.settleAt + BOOT.settle,
} as const;

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** The timings as CSS variables (--boot-coreAt → --boot-core-at), and the phone time scale. */
export const bootTimingCss = `:root{--boot-k:1;${Object.entries(BOOT)
  .map(([key, ms]) => `--boot-${kebab(key)}:${ms}ms`)
  .join(";")}}@media (max-width:63.99rem){:root{--boot-k:0.67}}`;

const STORAGE_KEY = "boot";
const CHANGE_EVENT = "bootchange";

/**
 * Runs in <head> after the motion script, before first paint. Plays the boot only with site motion on,
 * on the home page without a hash (a deep link goes straight to its section), in a visible tab, not on
 * back/forward, and once per session (no storage: no intro). Any scroll, wheel, press, touch or key, a
 * width change (measured at load, when layout is done anyway: a phone's layout viewport settles before
 * that, and reading it any earlier would force a layout of its own), the tab hiding or a motion change
 * skips it; the CSS clock ending finishes it. Either way
 * the floor is shown (data-floor) and "bootchange" fires. In the head, so a skip works before hydration.
 */
export const bootInitScript = `(function(){try{var d=document.documentElement,w=window,D=document;if(d.getAttribute("data-motion")!=="on"||location.pathname!=="/"||location.hash||D.hidden)return;var n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(n&&n.type==="back_forward")return;try{if(sessionStorage.getItem("${STORAGE_KEY}"))return;sessionStorage.setItem("${STORAGE_KEY}","1")}catch(e){return}d.setAttribute("data-boot","play");var E=["scroll","wheel","pointerdown","touchstart","keydown","motionchange"],o={capture:true,passive:true},W=0;function set(v){if(d.getAttribute("data-boot")!=="play")return;E.forEach(function(t){w.removeEventListener(t,skip,o)});w.removeEventListener("resize",rs);D.removeEventListener("visibilitychange",vis);D.removeEventListener("animationend",end);d.setAttribute("data-boot",v);d.setAttribute("data-floor","");w.dispatchEvent(new Event("${CHANGE_EVENT}"))}function skip(){set("skip")}function rs(){if(W&&w.innerWidth!==W)skip()}function vis(){if(D.hidden)skip()}function end(e){if(e.animationName==="boot-clock")set("end")}E.forEach(function(t){w.addEventListener(t,skip,o)});w.addEventListener("resize",rs);w.addEventListener("load",function(){W=w.innerWidth});D.addEventListener("visibilitychange",vis);D.addEventListener("animationend",end)}catch(e){}})()`;

/*
 * Runs inline at the end of the hero's markup, only while the boot plays. FLIP's "first": in the first
 * animation frame (before first paint, when the frame's layout is due anyway, so measuring forces no extra
 * layout pass), it measures the cube's slot, the caption and the three blocks that detach from the cube,
 * and writes the offsets that put the cube at the viewport centre (at boot size), the caption just under
 * it, and each block on its own block of the cube (data-u/data-v: its centre as a share of the cube's
 * box), at that block's size. The status dot's block sits inside the pill, which travels too, so the pill's
 * offset is taken off its own. Each is set (one small stylesheet, by attribute) on the element that uses
 * it, so only those small subtrees restyle, and React's elements are left as rendered for hydration. Their
 * animations run from there to no transform at all, so the end is always the real layout, whatever a late
 * font swap does to the start. The centre and boot size also go on <html>, for the desktop 3D growth.
 * The cube's poster is boot size (clamp(160px, 36vmin, 260px)) across; the cube's lowest corner sits
 * 0.375 of it below its centre (y ≈ 350 of 400).
 */
export const bootMeasureScript = `(function(){var d=document.documentElement;if(d.getAttribute("data-boot")!=="play")return;requestAnimationFrame(function(){try{var q=function(s){return document.querySelector(s)},v=q("[data-boot-cube]"),c=q("[data-boot-caption]"),p=q(".boot-pill"),W=innerWidth,H=innerHeight,S=Math.min(260,Math.max(160,0.36*Math.min(W,H))),X=W/2,Y=H/2,cx=0,cy=0,mid=function(e){var r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,r.width]},css=":root{--boot-cx:"+X+"px;--boot-cy:"+Y+"px;--boot-size:"+S+"px}";if(v){var a=mid(v);if(a[2]>0)css+="[data-boot-cube]{--boot-cube-x:"+(X-a[0])+"px;--boot-cube-y:"+(Y-a[1])+"px;--boot-cube-s:"+S/a[2]+"}"}if(c&&p){var b=mid(c);cx=X-b[0];cy=Y+0.375*S+18-b[1];css+=".boot-pill{--boot-cap-x:"+cx+"px;--boot-cap-y:"+cy+"px}"}document.querySelectorAll("[data-boot-block]").forEach(function(e){var m=mid(e),k=e.getAttribute("data-boot-block"),o=k==="dot"?1:0;if(!m[2])return;css+="[data-boot-block="+k+"]{--boot-from-x:"+(X+S*+e.getAttribute("data-u")-m[0]-o*cx)+"px;--boot-from-y:"+(Y+S*+e.getAttribute("data-v")-m[1]-o*cy)+"px;--boot-from-s:"+S*+e.getAttribute("data-s")/m[2]+"}"});var t=document.createElement("style");t.textContent=css;document.head.appendChild(t)}catch(e){}})})()`;

export type BootState = "play" | "end" | "skip" | "none";

export function bootState(): BootState {
  const value = document.documentElement.getAttribute("data-boot");
  return value === "play" || value === "end" || value === "skip" ? value : "none";
}

/** Calls `onChange` when the boot ends or is skipped (fired by bootInitScript, synchronously). */
export function subscribeBoot(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}
