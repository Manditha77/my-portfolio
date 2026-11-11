import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { MathUtils, Matrix4, Vector3, type InstancedMesh, type ShaderMaterial } from "three";
import { createBlockUniforms, fragmentShader, readTokenColors, vertexShader, type BlockUniforms } from "./build-material";
import { BLOCK, BLOCKS, REST, blendPoses, createPoses, fillShape, placePoses, type Pose, type PoseInput } from "./build-poses";
import { FOLDING, FORMED, TRAVELLING, UNFOLDING, buildProgress, measureBuild, type BuildMap, type Rect } from "./build-scroll";

/*
 * "The Build": the hero's "systems from parts" cube as one continuous scroll companion. 100 instanced
 * blocks in one draw call with no textures. Each home section has a free box beside its heading
 * (build-scroll.ts). Between them the companion travels as a small turning cube down the outer right
 * margin (the lane); at each box it unfolds into that section's shape (build-shapes.ts), staggered so it
 * assembles in parts, holds while the heading is in view, then folds back into the cube and travels on.
 * Scrubbed by scroll and reversible. While a shape is formed and on screen it plays its live actions
 * (build-live.ts). In the hero the cube turns slowly, separates under the pointer, and gently separates
 * and reassembles after a few seconds without interaction.
 * The canvas sits in the document behind all content, so it scrolls with the page natively. Its clipped
 * box follows the blocks, cut to the current phase's safe area (a stop's band, or the lane), so it can
 * never draw over text or a card, even on a frame that lags the scroll.
 * Renders on demand: every frame while scroll moves it or something eases, ~30 fps while only the cube
 * turns or a shape's live actions play (and only while it is on screen), and not at all otherwise.
 * Only loaded lazily by HeroVisual.
 */

export type PointerState = {
  /** -1..1 across the hero visual, +y up. */
  x: number;
  y: number;
  inside: boolean;
  /** performance.now() of the last pointermove over the hero visual. */
  lastMove: number;
  /** performance.now() of the last interaction anywhere on the page (pointer, key, scroll). */
  lastActivity: number;
  /** Requests a frame straight away (set by the canvas while it's mounted). */
  wake?: () => void;
};

const SPIN_SPEED = 0.15; // rad/s
const MAX_TILT = 0.15; // rad
const EASE = 6; // damp lambda: ~95% of the way in 0.5s
const SETTLE_AFTER_MS = 1200;

// Idle "breathing" (ASSEMBLE): apart for the first part of each cycle, then back together and rest.
const IDLE_AFTER_MS = 4000;
const IDLE_CYCLE_MS = 5000;
const IDLE_APART_MS = 1600;
const IDLE_SPREAD = 0.6; // share of a full separation
const IDLE_EASE = 2.5; // softer than EASE: ~95% of the way in 1.2s

// Scroll progress follows the page with a ~125ms time constant, so wheel steps don't snap.
const PROGRESS_EASE = 8;
const PROGRESS_SETTLED = 1e-3; // of one phase: well under a pixel

// Live actions ease in once a shape is formed (~95% in 0.6s) and out as it folds.
const LIVE_EASE = 5;
const LIVE_SETTLED = 1e-3;

// While only the cube turns or live actions play: small enough steps at 30 fps not to read as stutter.
const TIMED_FRAME_MS = 33;
// "Close enough" for the eased values: under ~0.1px of block movement for separation, ~0.2px for tilt.
const SEPARATION_SETTLED = 5e-3;
const TILT_SETTLED = 1e-3;

// Around the blocks' bounds, for their antialiased edges, px.
const BOX_PAD = 2;

// Reused every frame (there is only ever one companion), so a frame allocates nothing.
const scratch = {
  from: createPoses(),
  to: createPoses(),
  out: createPoses(),
  cube: { ...REST } as PoseInput,
  shape: { ...REST } as PoseInput,
  matrix: new Matrix4(),
  position: new Vector3(),
};

const EMPTY: Rect = { left: 0, top: 0, right: 0, bottom: 0 };

type MotionState = { separation: number; tiltX: number; tiltY: number };

/** True while any eased value is still visibly short of its target. */
function isEasing(m: MotionState, separation: number, tiltX: number, tiltY: number): boolean {
  return (
    Math.abs(m.separation - separation) > SEPARATION_SETTLED ||
    Math.abs(m.tiltX - tiltX) > TILT_SETTLED ||
    Math.abs(m.tiltY - tiltY) > TILT_SETTLED
  );
}

/**
 * The blocks' bounds in document px (whole pixels, padded), cut to `safe` and to the canvas size.
 * Empty when nothing is left: then the box has no size and draws nothing.
 */
function clipBox(poses: Pose[], zoom: number, safe: Rect, maxWidth: number, maxHeight: number): Rect {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const pose of poses) {
    const radius = 0.5 * BLOCK * pose.scale.length();
    if (radius === 0) continue;
    const x = pose.position.x;
    const y = -pose.position.y;
    left = Math.min(left, (x - radius) * zoom);
    right = Math.max(right, (x + radius) * zoom);
    top = Math.min(top, (y - radius) * zoom);
    bottom = Math.max(bottom, (y + radius) * zoom);
  }
  const clip = {
    left: Math.max(Math.floor(left - BOX_PAD), Math.ceil(safe.left)),
    top: Math.max(Math.floor(top - BOX_PAD), Math.ceil(safe.top)),
    right: Math.min(Math.ceil(right + BOX_PAD), Math.floor(safe.right)),
    bottom: Math.min(Math.ceil(bottom + BOX_PAD), Math.floor(safe.bottom)),
  };
  clip.right = Math.min(clip.right, clip.left + maxWidth);
  clip.bottom = Math.min(clip.bottom, clip.top + maxHeight);
  return clip.right > clip.left && clip.bottom > clip.top ? clip : EMPTY;
}

/** Moves the clipped box onto `clip` (document px). */
function placeBox(box: HTMLElement, clip: Rect) {
  box.style.left = `${clip.left}px`;
  box.style.top = `${clip.top}px`;
  box.style.width = `${clip.right - clip.left}px`;
  box.style.height = `${clip.bottom - clip.top}px`;
}

const sameRect = (a: Rect, b: Rect) =>
  a.left === b.left && a.top === b.top && a.right === b.right && a.bottom === b.bottom;

type BlocksProps = {
  mapRef: RefObject<BuildMap | null>;
  boxRef: RefObject<HTMLDivElement | null>;
  pointerRef: RefObject<PointerState>;
  visible: boolean;
  onReady: () => void;
};

function Blocks({ mapRef, boxRef, pointerRef, visible, onReady }: BlocksProps) {
  const invalidate = useThree((state) => state.invalidate);
  const visibleRef = useRef(visible);
  const timer = useRef<number | undefined>(undefined);
  const meshRef = useRef<InstancedMesh>(null);
  const themeDirty = useRef(true);
  const motion = useRef({
    separation: 0,
    tiltX: 0,
    tiltY: 0,
    spin: 0,
    progress: -1,
    frames: 0,
    /** The clipped box as last placed, document px. */
    box: EMPTY,
    /** Live actions: weight, the seconds they have played, and the stop they belong to (-1: none). */
    live: 0,
    liveTime: 0,
    liveStop: -1,
    /** Off screen with something to play: the next scroll asks for a frame even if the path didn't move. */
    sleeping: false,
  });
  const [uniforms] = useState(createBlockUniforms);
  const [glowArray] = useState(() => new Float32Array(BLOCKS));

  // Recolour when the theme toggle (or the OS theme) changes data-theme on <html>.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      themeDirty.current = true;
      invalidate();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [invalidate]);

  // Pointer moves over the hero visual and re-measures ask for a frame at once.
  useEffect(() => {
    const pointer = pointerRef.current;
    pointer.wake = invalidate;
    return () => {
      pointer.wake = undefined;
      window.clearTimeout(timer.current);
    };
  }, [pointerRef, invalidate]);

  // Scroll asks for at most one frame per animation frame, and only when the scroll moved the companion
  // along its path (or it was waiting off screen): otherwise its box just scrolls with the page.
  useEffect(() => {
    let frame = 0;
    let last = -1;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const map = mapRef.current;
        const target = map ? buildProgress(window.scrollY, map) : -1;
        if (target === last && !motion.current.sleeping) return;
        last = target;
        invalidate();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [mapRef, invalidate]);

  // The tab visible again: restart the frame chain.
  useEffect(() => {
    visibleRef.current = visible;
    if (visible) invalidate();
    else window.clearTimeout(timer.current);
  }, [visible, invalidate]);

  useFrame((state, rawDelta) => {
    const mesh = meshRef.current;
    const box = boxRef.current;
    const map = mapRef.current;
    if (!mesh || !box || !map || map.stops.length === 0) return;
    const { stops, lane, zoom } = map;

    // Orthographic zoom is px per world unit: the hero cube keeps the poster's size.
    if (state.camera.zoom !== zoom) {
      state.camera.zoom = zoom;
      state.camera.updateProjectionMatrix();
    }

    if (themeDirty.current) {
      readTokenColors((mesh.material as ShaderMaterial).uniforms as BlockUniforms);
      themeDirty.current = false;
    }

    // Clamp so resuming after a pause doesn't jump.
    const delta = Math.min(rawDelta, 0.1);
    const m = motion.current;
    const pointer = pointerRef.current;
    const now = performance.now();

    // Which stop, which phase of it (unfolding, formed, folding, travelling on), and how far through.
    const target = buildProgress(window.scrollY, map);
    m.progress = m.progress < 0 ? target : MathUtils.damp(m.progress, target, PROGRESS_EASE, delta);
    if (Math.abs(m.progress - target) < PROGRESS_SETTLED) m.progress = target;
    const index = Math.min(Math.floor(m.progress), stops.length - 1);
    const quarters = (m.progress - index) * 4;
    const phase = Math.min(TRAVELLING, Math.floor(quarters));
    const k = Math.min(1, quarters - phase);
    const stop = stops[index];
    const next = stops[index + 1] ?? stop;

    // Hero only: pointer separation and tilt, and the idle breathing, fade out as it folds away.
    let heroWeight = 0;
    if (index === 0 && phase < FOLDING) heroWeight = 1;
    else if (index === 0 && phase === FOLDING) heroWeight = 1 - k;
    const moving = pointer.inside && now - pointer.lastMove < SETTLE_AFTER_MS;
    const idleFor = now - pointer.lastActivity - IDLE_AFTER_MS;
    const breathing = heroWeight === 1 && !moving && idleFor > 0;

    let separation = moving ? heroWeight : 0;
    if (breathing) separation = idleFor % IDLE_CYCLE_MS < IDLE_APART_MS ? IDLE_SPREAD : 0;
    const tiltXTarget = pointer.inside ? -pointer.y * MAX_TILT * heroWeight : 0;
    const tiltYTarget = pointer.inside ? pointer.x * MAX_TILT * heroWeight : 0;

    m.separation = MathUtils.damp(m.separation, separation, breathing ? IDLE_EASE : EASE, delta);
    m.tiltX = MathUtils.damp(m.tiltX, tiltXTarget, EASE, delta);
    m.tiltY = MathUtils.damp(m.tiltY, tiltYTarget, EASE, delta);
    // The cube turns wherever it shows: in the hero, travelling, and while folding or unfolding.
    const cubeShows = index === 0 || phase !== FORMED;
    if (cubeShows) m.spin += SPIN_SPEED * delta;

    // Live actions: on their own clock from the moment a shape forms, easing in and out.
    const formed = index > 0 && phase === FORMED;
    if (formed && m.liveStop !== index) {
      m.liveStop = index;
      m.liveTime = 0;
    }
    m.live = MathUtils.damp(m.live, formed ? 1 : 0, LIVE_EASE, delta);
    if (!formed && m.live < LIVE_SETTLED) {
      m.live = 0;
      m.liveStop = -1;
    }
    if (m.live > 0) m.liveTime += delta;

    const cube = scratch.cube;
    cube.spin = m.spin;
    cube.tiltX = m.tiltX;
    cube.tiltY = m.tiltY;
    cube.separation = m.separation;
    const shape = scratch.shape;
    shape.live = m.live;
    shape.time = m.liveTime;
    // Skills' last tile drops into its slot over the end of the unfold.
    shape.settle = phase === UNFOLDING ? MathUtils.smoothstep(k, 0.75, 1) : 1;

    // Page units (document px / zoom, +y up).
    const laneX = lane.x / zoom;
    const stopX = stop.x / zoom;
    const stopY = -stop.y / zoom;
    let poses: Pose[] = scratch.to;
    let safe: Rect = stop.safe;
    if (phase === TRAVELLING) {
      // Down the lane towards the next stop (the last stop never gets here).
      safe = lane.safe;
      fillShape("cube", poses, cube);
      placePoses(poses, laneX, -MathUtils.lerp(stop.y, next.y, k) / zoom, lane.scale);
    } else if (index === 0) {
      // The hero cube shrinks and slides into the lane as one piece.
      const t = phase === FOLDING ? MathUtils.smoothstep(k, 0, 1) : 0;
      fillShape("cube", poses, cube);
      placePoses(poses, MathUtils.lerp(stopX, laneX, t), stopY, MathUtils.lerp(stop.scale, lane.scale, t));
    } else if (phase === FORMED) {
      fillShape(stop.shape, poses, shape);
      placePoses(poses, stopX, stopY, stop.scale);
    } else {
      // The blocks travel between the cube in the lane and the shape in its box, staggered.
      fillShape("cube", scratch.from, cube);
      placePoses(scratch.from, laneX, stopY, lane.scale);
      fillShape(stop.shape, scratch.to, shape);
      placePoses(scratch.to, stopX, stopY, stop.scale);
      poses = scratch.out;
      if (phase === UNFOLDING) blendPoses(scratch.from, scratch.to, k, poses);
      else blendPoses(scratch.to, scratch.from, k, poses, true);
    }

    // The clipped box follows the blocks, inside the phase's safe area.
    const clip = clipBox(poses, zoom, safe, state.size.width, state.size.height);
    if (!sameRect(clip, m.box)) {
      m.box = clip;
      placeBox(box, clip);
    }

    // The canvas fills the box from its top-left corner; the camera looks at the canvas's centre.
    const originX = (clip.left + state.size.width / 2) / zoom;
    const originY = -(clip.top + state.size.height / 2) / zoom;
    const { matrix, position } = scratch;
    const glow = mesh.geometry.getAttribute("instanceGlow");
    for (let i = 0; i < BLOCKS; i++) {
      const pose = poses[i];
      position.set(pose.position.x - originX, pose.position.y - originY, pose.position.z);
      mesh.setMatrixAt(i, matrix.compose(position, pose.quaternion, pose.scale));
      glow.setX(i, pose.glow);
    }
    mesh.instanceMatrix.needsUpdate = true;
    glow.needsUpdate = true;

    // Report ready once a real frame has been drawn.
    if (m.frames < 2 && ++m.frames === 2) onReady();

    // Next frame: straight away while scroll moves the companion or anything eases; a timed frame while
    // the cube turns or live actions play on screen; otherwise none until scroll, a resize or the pointer.
    const onScreen =
      clip.right > clip.left && clip.top < window.scrollY + window.innerHeight && clip.bottom > window.scrollY;
    const looping = cubeShows || formed || m.live > 0;
    m.sleeping = false;
    window.clearTimeout(timer.current);
    if (m.frames < 2 || m.progress !== target || isEasing(m, separation, tiltXTarget, tiltYTarget)) {
      state.invalidate();
    } else if (looping && onScreen) {
      timer.current = window.setTimeout(() => {
        if (visibleRef.current) invalidate();
      }, TIMED_FRAME_MS);
    } else {
      m.sleeping = looping;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BLOCKS]} frustumCulled={false}>
      <boxGeometry args={[BLOCK, BLOCK, BLOCK]}>
        <instancedBufferAttribute attach="attributes-instanceGlow" args={[glowArray, 1]} />
      </boxGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </instancedMesh>
  );
}

type PartsCubeProps = {
  /** The hero visual's box: the cube's position and size at scroll 0. */
  heroRef: RefObject<HTMLElement | null>;
  pointerRef: RefObject<PointerState>;
  onReady: () => void;
  onFail: () => void;
};

export function PartsCube({ heroRef, pointerRef, onReady, onFail }: PartsCubeProps) {
  const mapRef = useRef<BuildMap | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [ready, setReady] = useState(false);

  // Measure the sections (and the hero box) now and whenever the layout or content changes size.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const map = measureBuild(hero);
      mapRef.current = map;
      const { canvasWidth: width, canvasHeight: height } = map;
      setCanvasSize((size) => (size?.width === width && size.height === height ? size : { width, height }));
      pointerRef.current.wake?.();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(hero);
    const main = document.querySelector("main");
    if (main) observer.observe(main);
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [heroRef, pointerRef]);

  // Rendering stops entirely while the tab is hidden.
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  if (!canvasSize) return null;

  // Absolutely positioned in the document around the blocks (set per frame), clipped and behind all page
  // content. The canvas inside keeps the largest safe area's size, so moving never reallocates it.
  return createPortal(
    <div
      ref={boxRef}
      aria-hidden="true"
      data-build-box
      className="pointer-events-none absolute top-0 left-0 -z-1 size-0 overflow-hidden"
    >
      <div
        data-ready={ready || undefined}
        className="opacity-0 transition-opacity duration-400 data-ready:opacity-100"
        style={canvasSize}
      >
        <Canvas
          orthographic
          camera={{ position: [0, 0, 10], zoom: 100 }}
          dpr={[1, 1.5]}
          flat
          frameloop={visible ? "demand" : "never"}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", onFail, { once: true });
          }}
        >
          <Blocks
            mapRef={mapRef}
            boxRef={boxRef}
            pointerRef={pointerRef}
            visible={visible}
            onReady={() => {
              setReady(true);
              onReady();
            }}
          />
        </Canvas>
      </div>
    </div>,
    document.body,
  );
}
