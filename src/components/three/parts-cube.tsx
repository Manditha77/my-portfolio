import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { MathUtils, Matrix4, Vector3, type InstancedMesh, type Mesh, type ShaderMaterial } from "three";
import { setBuildDock } from "@/lib/build-dock";
import { SEQUENCE, readSequence } from "@/lib/hero-sequence";
import { duration } from "@/lib/motion-tokens";
import {
  beamFragmentShader,
  beamVertexShader,
  createBeamUniforms,
  createBlockUniforms,
  fragmentShader,
  readTokenColors,
  vertexShader,
  type BeamUniforms,
  type BlockUniforms,
} from "./build-material";
import {
  BLOCK,
  BLOCKS,
  REST,
  beamHalf,
  beamOpacity,
  createPoses,
  fillShape,
  layerPrintPoses,
  placePoses,
  printPoses,
  type Pose,
  type PoseInput,
} from "./build-poses";
import {
  BETWEEN,
  ENTERING,
  EXITING,
  FORMED,
  buildProgress,
  dockAt,
  measureBuild,
  type BuildMap,
  type Rect,
} from "./build-scroll";

/*
 * "The Build": the hero's "systems from parts" cube as one continuous scroll companion. 100 instanced
 * blocks in one draw call with no textures, plus the build beam (one thin plane). On first load it can
 * take over the poster's build sequence (src/lib/hero-sequence.ts) at "act" and print the cube's blocks
 * layer by layer into the blueprint; otherwise its hero cube waits until the poster has finished.
 * Each home section has a free box beside its heading (build-scroll.ts). As a box scrolls in, the beam
 * rises through it and prints that section's shape (build-shapes.ts) layer by layer; the shape holds
 * while the heading is in view, then the beam falls through it and dissolves it as it scrolls away, and
 * the next box prints the next. Scrubbed by scroll and reversible. The header mark docks each shape as
 * its beam starts (build-dock.ts). While a shape is formed and on screen it plays its live actions
 * (build-live.ts). In the hero the cube turns slowly, separates under the pointer, and gently separates
 * and reassembles after a few seconds without interaction.
 * The canvas sits in the document behind all content, so it scrolls with the page natively. Its clipped
 * box follows the blocks, cut to the stop's band, so it can never draw over text or a card, even on a
 * frame that lags the scroll.
 * Renders on demand: every frame while scroll moves it or something eases, ~30 fps while only the hero
 * cube turns or a shape's live actions play (and only while it is on screen), and not at all otherwise.
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

// Scroll progress follows the page with a ~200ms time constant, so wheel steps glide rather than snap.
const PROGRESS_EASE = 5;
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

// The build beam's height on screen (its core is ~2px; the rest is its soft halo), px.
const BEAM_PX = 24;
// After the build sequence the cube's turn eases up to speed (~95% in 1s).
const SPIN_EASE = 3;
// The 3D cube only takes over the sequence's act if its canvas has time to fade in before it.
const PRINT_BEFORE = SEQUENCE.actStart - duration.slow;

// Reused every frame (there is only ever one companion), so a frame allocates nothing.
const scratch = {
  placed: createPoses(),
  first: createPoses(),
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
 * The blocks' bounds in document px (whole pixels, padded), with `extra` (the beam) if any, cut to `safe`
 * and to the canvas size. Empty when nothing is left: then the box has no size and draws nothing.
 */
function clipBox(
  poses: Pose[],
  zoom: number,
  safe: Rect,
  maxWidth: number,
  maxHeight: number,
  extra: Rect | null,
): Rect {
  let left = extra?.left ?? Infinity;
  let right = extra?.right ?? -Infinity;
  let top = extra?.top ?? Infinity;
  let bottom = extra?.bottom ?? -Infinity;
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

/**
 * Moves the clipped box onto `clip` (document px). By transform, not left/top: a moving box would
 * otherwise count as a layout shift (CLS) while the blocks fly in or the beam prints.
 */
function placeBox(box: HTMLElement, clip: Rect) {
  box.style.transform = `translate(${clip.left}px, ${clip.top}px)`;
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
  /** The canvas has drawn: it fades in. */
  onDrawn: () => void;
  /** The 3D hero cube is showing (or printing): the poster's cube can go. */
  onHeroShown: () => void;
};

/**
 * The first-load build sequence, as the companion sees it: not yet decided (first frame), printing its
 * act, waiting (hidden) for the poster to finish it, or over (finished, or never played).
 */
type SequenceRole = "undecided" | "print" | "wait" | "none";

function Blocks({ mapRef, boxRef, pointerRef, visible, onDrawn, onHeroShown }: BlocksProps) {
  const invalidate = useThree((state) => state.invalidate);
  const visibleRef = useRef(visible);
  const timer = useRef<number | undefined>(undefined);
  const meshRef = useRef<InstancedMesh>(null);
  const beamRef = useRef<Mesh>(null);
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
    sequence: "undecided" as SequenceRole,
    /** performance.now() when the build sequence ended (the idle breathing waits from here too). */
    sequenceEnded: 0,
    /** onHeroShown has been called. */
    heroShown: false,
    /** The cube's turn speed, as a share of SPIN_SPEED: held at 0 through the sequence, then eased up. */
    spinRate: 1,
  });
  const [uniforms] = useState(createBlockUniforms);
  const [beamUniforms] = useState(() => createBeamUniforms(uniforms));
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
        if (map) setBuildDock(dockAt(window.scrollY, map));
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
    const beamMesh = beamRef.current;
    const box = boxRef.current;
    const map = mapRef.current;
    if (!mesh || !beamMesh || !box || !map || map.stops.length === 0) return;
    const { stops, zoom } = map;

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

    // Which stop, which phase of it (entering, formed, exiting, between stops), and how far through.
    const target = buildProgress(window.scrollY, map);
    m.progress = m.progress < 0 ? target : MathUtils.damp(m.progress, target, PROGRESS_EASE, delta);
    if (Math.abs(m.progress - target) < PROGRESS_SETTLED) m.progress = target;
    const index = Math.min(Math.floor(m.progress), stops.length - 1);
    const quarters = (m.progress - index) * 4;
    const phase = Math.min(BETWEEN, Math.floor(quarters));
    const k = Math.min(1, quarters - phase);
    const stop = stops[index];
    const hero = index === 0;

    // The first-load build sequence, on the poster's clock. Decided on the first frame: the 3D cube prints
    // the act only if the hero cube is formed and on screen and the act is far enough off; otherwise it
    // stays hidden until the poster has finished. Scrolling away mid-way dissolves it like any other shape.
    const sequence = m.sequence === "none" ? { time: Infinity, paused: false } : readSequence();
    if (m.sequence === "undecided") {
      // Fully formed: the hero may already be "exiting" at scroll 0, but not yet any part of the way.
      const heroFormed = hero && (phase === FORMED || (phase === EXITING && k <= 0));
      const heroOnScreen = stop.top < window.scrollY + window.innerHeight && stop.top + stop.height > window.scrollY;
      if (!Number.isFinite(sequence.time)) m.sequence = "none";
      else m.sequence = heroFormed && heroOnScreen && sequence.time <= PRINT_BEFORE ? "print" : "wait";
      if (m.sequence !== "none") m.spinRate = 0;
    } else if (m.sequence !== "none" && !Number.isFinite(sequence.time)) {
      m.sequence = "none";
      m.sequenceEnded = now;
    }
    const sequenceRunning = m.sequence !== "none";

    // Hero only: pointer separation and tilt, and the idle breathing, fade out as it dissolves; none of
    // them during the build sequence.
    let heroWeight = 0;
    if (hero && phase < EXITING) heroWeight = 1;
    else if (hero && phase === EXITING) heroWeight = 1 - k;
    if (sequenceRunning) heroWeight = 0;
    const moving = pointer.inside && now - pointer.lastMove < SETTLE_AFTER_MS;
    const idleFor = now - Math.max(pointer.lastActivity, m.sequenceEnded) - IDLE_AFTER_MS;
    const breathing = heroWeight === 1 && !moving && idleFor > 0;

    let separation = moving ? heroWeight : 0;
    if (breathing) separation = idleFor % IDLE_CYCLE_MS < IDLE_APART_MS ? IDLE_SPREAD : 0;
    const tiltXTarget = pointer.inside ? -pointer.y * MAX_TILT * heroWeight : 0;
    const tiltYTarget = pointer.inside ? pointer.x * MAX_TILT * heroWeight : 0;

    m.separation = MathUtils.damp(m.separation, separation, breathing ? IDLE_EASE : EASE, delta);
    m.tiltX = MathUtils.damp(m.tiltX, tiltXTarget, EASE, delta);
    m.tiltY = MathUtils.damp(m.tiltY, tiltYTarget, EASE, delta);
    // The hero cube turns until it has dissolved; after the build sequence it eases up to speed.
    const cubeShows = hero && phase !== BETWEEN;
    m.spinRate = sequenceRunning ? 0 : MathUtils.damp(m.spinRate, 1, SPIN_EASE, delta);
    if (cubeShows) m.spin += SPIN_SPEED * m.spinRate * delta;

    // Live actions: on their own clock from the moment a shape forms, easing in and out.
    const formed = !hero && phase === FORMED;
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
    // Skills' last tile drops into its slot over the end of the enter.
    shape.settle = phase === ENTERING ? MathUtils.smoothstep(k, 0.75, 1) : 1;

    // The shape in its box (page units: document px / zoom, +y up); entering, the beam rises through it
    // and prints it, and exiting, the beam falls through it and dissolves it. Between stops nothing shows.
    let poses: Pose[] | null = null;
    let beam: { y: number; opacity: number; trail: number } | null = null;
    if (phase !== BETWEEN) {
      const key = hero ? "cube" : stop.shape;
      const centreY = -stop.y / zoom;
      fillShape(key, scratch.placed, hero ? cube : shape);
      placePoses(scratch.placed, stop.x / zoom, centreY, stop.scale);
      poses = scratch.placed;
      const half = beamHalf(key) * stop.scale;
      const low = centreY - half;
      const high = centreY + half;
      // The build sequence: hidden while the poster plays it, or printing its act layer by layer.
      if (hero && m.sequence === "wait") poses = null;
      else if (hero && m.sequence === "print") {
        layerPrintPoses(scratch.placed, scratch.first, sequence.time);
        poses = scratch.first;
      }
      if (poses && (phase === ENTERING || phase === EXITING)) {
        const rising = phase === ENTERING;
        const along = MathUtils.smoothstep(k, 0, 1);
        const y = rising ? MathUtils.lerp(low, high, along) : MathUtils.lerp(high, low, along);
        printPoses(poses, scratch.out, y, rising ? "in" : "out");
        poses = scratch.out;
        // Only while blocks are changing: never a line over a formed shape.
        const opacity = beamOpacity(scratch.placed, y, rising ? "in" : "out");
        if (opacity > 0) beam = { y, opacity, trail: rising ? 1 : -1 };
      }
    }

    // The clipped box follows the blocks (and the beam, across the free box), inside the stop's band.
    const beamRect = beam && {
      left: stop.beam.left,
      right: stop.beam.right,
      top: -beam.y * zoom - BEAM_PX / 2,
      bottom: -beam.y * zoom + BEAM_PX / 2,
    };
    const clip = poses ? clipBox(poses, zoom, stop.safe, state.size.width, state.size.height, beamRect) : EMPTY;
    if (!sameRect(clip, m.box)) {
      m.box = clip;
      placeBox(box, clip);
    }

    // The canvas fills the box from its top-left corner; the camera looks at the canvas's centre.
    const originX = (clip.left + state.size.width / 2) / zoom;
    const originY = -(clip.top + state.size.height / 2) / zoom;
    const { matrix, position } = scratch;
    const glow = mesh.geometry.getAttribute("instanceGlow");
    if (poses && clip !== EMPTY) {
      for (let i = 0; i < BLOCKS; i++) {
        const pose = poses[i];
        position.set(pose.position.x - originX, pose.position.y - originY, pose.position.z);
        mesh.setMatrixAt(i, matrix.compose(position, pose.quaternion, pose.scale));
        glow.setX(i, pose.glow);
      }
      mesh.instanceMatrix.needsUpdate = true;
      glow.needsUpdate = true;
    }
    beamMesh.visible = beam !== null && clip !== EMPTY;
    if (beam && beamMesh.visible) {
      const width = (stop.beam.right - stop.beam.left) / zoom;
      beamMesh.position.set((stop.beam.left + stop.beam.right) / 2 / zoom - originX, beam.y - originY, 5);
      beamMesh.scale.set(width, BEAM_PX / zoom, 1);
      const beamUniforms = (beamMesh.material as ShaderMaterial).uniforms as BeamUniforms;
      beamUniforms.uOpacity.value = beam.opacity;
      beamUniforms.uTrail.value = beam.trail;
    }

    // The canvas fades in once a real frame has been drawn; the poster's cube goes once the 3D one shows.
    if (m.frames < 2 && ++m.frames === 2) onDrawn();
    if (!m.heroShown && m.frames === 2 && m.sequence !== "wait") {
      m.heroShown = true;
      onHeroShown();
    }

    // Next frame: straight away while scroll moves the companion or anything eases; a timed frame while
    // the hero cube turns or live actions play on screen; otherwise none until scroll, a resize or the
    // pointer.
    const onScreen =
      clip.right > clip.left && clip.top < window.scrollY + window.innerHeight && clip.bottom > window.scrollY;
    const looping = cubeShows || formed || m.live > 0;
    m.sleeping = false;
    window.clearTimeout(timer.current);
    const sequenceMoving = sequenceRunning && !sequence.paused;
    if (m.frames < 2 || sequenceMoving || m.progress !== target || isEasing(m, separation, tiltXTarget, tiltYTarget)) {
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
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, BLOCKS]} frustumCulled={false}>
        <boxGeometry args={[BLOCK, BLOCK, BLOCK]}>
          <instancedBufferAttribute attach="attributes-instanceGlow" args={[glowArray, 1]} />
        </boxGeometry>
        <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      </instancedMesh>
      {/* The build beam: drawn over the blocks, never into the depth buffer. */}
      <mesh ref={beamRef} visible={false} frustumCulled={false} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          uniforms={beamUniforms}
          vertexShader={beamVertexShader}
          fragmentShader={beamFragmentShader}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

type PartsCubeProps = {
  /** The hero visual's box: the cube's position and size at scroll 0. */
  heroRef: RefObject<HTMLElement | null>;
  pointerRef: RefObject<PointerState>;
  /** The 3D hero cube is showing: the poster's cube can fade out. */
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
      setBuildDock(dockAt(window.scrollY, map));
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
      setBuildDock(null);
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
        className="opacity-0 transition-opacity duration-slow data-ready:opacity-100"
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
            onDrawn={() => setReady(true)}
            onHeroShown={onReady}
          />
        </Canvas>
      </div>
    </div>,
    document.body,
  );
}
