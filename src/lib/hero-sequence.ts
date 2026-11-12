/*
 * PIPELINE (Sense → Analyze → Act): the hero's first-load build sequence, once per page load.
 *   sense:   the cube's blueprint draws itself, edge by edge, then the block lines on its faces;
 *   analyze: the build beam scans up through the blueprint once;
 *   act:     the blocks print into it layer by layer, and the blueprint fades;
 * then the status line types out and the cube turns.
 * The poster (HeroPoster) plays it in CSS from first paint, so it costs no JS and never waits for
 * hydration. Its SVG root carries a no-op "clock" animation that lasts the whole sequence; the status
 * line (PipelineStatus) and the 3D companion read that clock, so all three stay in step, and the status
 * line pauses it (every animation in it) while the hero is off screen or the tab is hidden.
 * Sequencing constants (CLAUDE.md §5): the CSS takes its timings from these, written inline by the poster.
 */

/** Milliseconds from first paint. */
export const SEQUENCE = {
  /** sense: outer edges, one after another. */
  edgeStagger: 50,
  edgeDraw: 220,
  /** sense: the 3×3 block lines on the visible faces. */
  gridFrom: 400,
  gridStagger: 15,
  gridDraw: 200,
  senseEnd: 800,
  /** analyze: one beam pass, bottom to top. */
  actStart: 1350,
  /** act: each voxel layer prints, bottom to top. */
  layerGap: 250,
  layerDraw: 300,
  actEnd: 2150,
  /** The blueprint fades as the cube completes. */
  blueprintFade: 250,
  end: 2400,
} as const;

/** Start and finish of each PIPELINE step, in step order (sense, analyze, act). */
export const SEQUENCE_STEPS: readonly (readonly [number, number])[] = [
  [0, SEQUENCE.senseEnd],
  [SEQUENCE.senseEnd, SEQUENCE.actStart],
  [SEQUENCE.actStart, SEQUENCE.actEnd],
];

/** When voxel layer `layer` (0 = bottom) starts printing. */
export const layerStart = (layer: number) => SEQUENCE.actStart + layer * SEQUENCE.layerGap;

const PLAYING = '[data-sequence="play"]';

// Once per page load: a remount (client navigation back home) starts finished.
let played = false;
let clock: Animation | undefined;

export const sequencePlayed = () => played;

export function markSequencePlayed() {
  played = true;
}

/**
 * Where the sequence is: ms since it started (from the CSS clock), and whether it is paused. Infinity
 * once it has finished, or when it isn't playing at all (motion off, a remount, no poster).
 */
export function readSequence(): { time: number; paused: boolean } {
  // Looked up once: read every frame by the status line and the 3D cube.
  if (!clock || clock.playState === "idle") clock = document.querySelector(`${PLAYING} [data-seq-clock]`)?.getAnimations()[0];
  const time = clock?.currentTime;
  if (!clock || typeof time !== "number" || clock.playState === "finished") return { time: Infinity, paused: false };
  return { time, paused: clock.playState === "paused" };
}

/** Pauses (or resumes) every animation in the sequence together. */
export function pauseSequence(paused: boolean) {
  const root = document.querySelector(PLAYING);
  if (!root) return;
  for (const animation of root.getAnimations({ subtree: true })) {
    if (paused && animation.playState === "running") animation.pause();
    // Only resume what was paused: play() on a finished animation would restart it.
    else if (!paused && animation.playState === "paused") animation.play();
  }
}
