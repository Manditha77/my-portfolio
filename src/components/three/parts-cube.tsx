import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { MathUtils, Matrix4, type InstancedMesh, type ShaderMaterial } from "three";
import { createBlockUniforms, fragmentShader, readTokenColors, vertexShader, type BlockUniforms } from "./build-material";
import { BLOCK, BLOCKS, REST, createPoses, fillShape, placePoses, streamPoses, type Pose, type PoseInput } from "./build-poses";
import { PORTRAIT_BLOCKS, PORTRAIT_REST, portraitEdge, portraitExit } from "./build-portrait";
import {
  BETWEEN,
  ENTERING,
  EXITING,
  FORMED,
  VIEW_UNITS,
  buildProgress,
  measureBuild,
  type BuildMap,
  type Rect,
} from "./build-scroll";

/*
 * "The Build": the hero's block portrait as one continuous scroll companion. One instanced mesh, one draw
 * call, no textures. In the hero, ~3,000 blocks form the portrait (build-portrait.ts) exactly where its
 * poster sits; it turns slightly towards the pointer and sways very slowly. As the hero scrolls away the
 * portrait crumbles: most blocks fall a little and fade, and 100 of them fall out of the box as plain
 * blocks. From there those 100 are the companion: each home section has a free box beside its heading
 * (build-scroll.ts). As a box scrolls in, the blocks stream down into it and assemble that section's
 * shape (build-shapes.ts), bottom first; the shape holds while the heading is in view, then its blocks
 * stream down out of the box as it scrolls away, and the next box takes them in. Scrubbed by scroll and
 * reversible. While a shape is formed and on screen it plays its live actions (build-live.ts).
 * The canvas sits in the document behind all content, so it scrolls with the page natively. Its clipped
 * box follows the blocks, cut to the stop's band, so it can never draw over text or a card, even on a
 * frame that lags the scroll.
 * Renders on demand: every frame while scroll moves it or the turn eases, ~30 fps while only the portrait
 * sways or a shape's live actions play (and only while it is on screen), and not at all otherwise.
 * Only loaded lazily by HeroVisual.
 */

export type PointerState = {
  /** -1..1 from the portrait's centre to the viewport's edges, +y up. */
  x: number;
  y: number;
  /** False once the pointer has left the page. */
  inside: boolean;
  /** Requests a frame straight away (set by the canvas while it's mounted). */
  wake?: () => void;
};

// The portrait turns towards the pointer, at most this far (rad: ~10° and ~6°).
const TURN_YAW = 0.175;
const TURN_PITCH = 0.105;
const EASE = 6; // damp lambda: ~95% of the way in 0.5s

// A very slow sway while it holds (rad, s), starting once the poster has handed over.
const SWAY_YAW = 0.044;
const SWAY_PITCH = 0.0175;
const SWAY_YAW_PERIOD = 14;
const SWAY_PITCH_PERIOD = 11;
const SWAY_AFTER = 0.8;

// Scroll progress follows the page with a ~200ms time constant, so wheel steps glide rather than snap.
const PROGRESS_EASE = 5;
const PROGRESS_SETTLED = 1e-3; // of one phase: well under a pixel

// Live actions ease in once a shape is formed (~95% in 0.6s) and out as it folds.
const LIVE_EASE = 5;
const LIVE_SETTLED = 1e-3;

// While only the portrait sways or live actions play: small enough steps at 30 fps not to read as stutter.
const TIMED_FRAME_MS = 33;
// "Close enough" for the eased turn: under ~0.2px of block movement.
const TURN_SETTLED = 1e-3;

// Around the blocks' bounds, for their antialiased edges, px.
const BOX_PAD = 2;

// Reused every frame (there is only ever one companion), so a frame allocates nothing.
const scratch = {
  placed: createPoses(),
  out: createPoses(),
  /** The next stop's shape at rest, sized for its box: what the handoff blocks grow into. */
  next: createPoses(),
  portrait: createPoses(PORTRAIT_BLOCKS),
  shape: { ...REST } as PoseInput,
  matrix: new Matrix4(),
};

const EMPTY: Rect = { left: 0, top: 0, right: 0, bottom: 0 };

const wave = (time: number, period: number) => Math.sin((2 * Math.PI * time) / period);

/**
 * The blocks' bounds in document px (whole pixels, padded), cut to `safe` and to the canvas size.
 * Empty when nothing is left: then the box has no size and draws nothing.
 */
function clipBox(poses: readonly Pose[], zoom: number, safe: Rect, maxWidth: number, maxHeight: number): Rect {
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
  return cut({ left: left - BOX_PAD, top: top - BOX_PAD, right: right + BOX_PAD, bottom: bottom + BOX_PAD }, safe, maxWidth, maxHeight);
}

/** `rect` in whole pixels, cut to `safe` and to the canvas size; empty when nothing is left. */
function cut(rect: Rect, safe: Rect, maxWidth: number, maxHeight: number): Rect {
  const clip = {
    left: Math.max(Math.floor(rect.left), Math.ceil(safe.left)),
    top: Math.max(Math.floor(rect.top), Math.ceil(safe.top)),
    right: Math.min(Math.ceil(rect.right), Math.floor(safe.right)),
    bottom: Math.min(Math.ceil(rect.bottom), Math.floor(safe.bottom)),
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
    /** The portrait's turn towards the pointer, rad. */
    turnX: 0,
    turnY: 0,
    /** Seconds the portrait has held (drives its sway). */
    holdTime: 0,
    /** The instances hold the portrait at rest, so a frame that only turns it writes none. */
    restWritten: false,
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
  const [lookArray] = useState(() => new Float32Array(4 * PORTRAIT_BLOCKS));

  // Recolour when the theme toggle (or the OS theme) changes data-theme on <html>.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      themeDirty.current = true;
      invalidate();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [invalidate]);

  // Pointer moves and re-measures ask for a frame at once.
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
    const { stops, zoom } = map;

    // Orthographic zoom is px per world unit: the portrait keeps its poster's size.
    const material = mesh.material as ShaderMaterial;
    if (state.camera.zoom !== zoom) {
      state.camera.zoom = zoom;
      state.camera.updateProjectionMatrix();
      material.uniforms.uEdge.value = portraitEdge(zoom * VIEW_UNITS);
    }

    if (themeDirty.current) {
      readTokenColors(material.uniforms as BlockUniforms);
      themeDirty.current = false;
    }

    // Clamp so resuming after a pause doesn't jump.
    const delta = Math.min(rawDelta, 0.1);
    const m = motion.current;
    const pointer = pointerRef.current;

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

    // Hero: the portrait turns towards the pointer and, while it holds, sways very slowly.
    const heroShows = hero && phase !== BETWEEN;
    const holding = hero && phase === FORMED;
    const turnXTarget = heroShows && pointer.inside ? -pointer.y * TURN_PITCH : 0;
    const turnYTarget = heroShows && pointer.inside ? pointer.x * TURN_YAW : 0;
    m.turnX = MathUtils.damp(m.turnX, turnXTarget, EASE, delta);
    m.turnY = MathUtils.damp(m.turnY, turnYTarget, EASE, delta);
    if (holding) m.holdTime += delta;
    const swayTime = Math.max(0, m.holdTime - SWAY_AFTER);

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

    const shape = scratch.shape;
    shape.live = m.live;
    shape.time = m.liveTime;
    // Skills' last tile drops into its slot over the end of the enter.
    shape.settle = phase === ENTERING ? MathUtils.smoothstep(k, 0.75, 1) : 1;

    let poses: readonly Pose[] | null = null;
    let clip = EMPTY;
    if (heroShows) {
      // The portrait, around its centre (the mesh carries its place and turn). Leaving, it crumbles: the
      // handoff blocks grow into the next shape's blocks as they fall out of the band.
      poses = PORTRAIT_REST;
      if (phase === EXITING) {
        const next = stops[1];
        if (next) {
          fillShape(next.shape, scratch.next, REST);
          placePoses(scratch.next, 0, 0, next.scale);
        }
        portraitExit(k, scratch.portrait, (stop.y - stop.safe.bottom) / zoom, next ? scratch.next : null);
        poses = scratch.portrait;
      }
      // The whole hero box (the visual plus its margin): the turn and sway stay well inside it.
      const heroBox = { left: stop.left, top: stop.top, right: stop.left + stop.width, bottom: stop.top + stop.height };
      clip = cut(heroBox, stop.safe, state.size.width, state.size.height);
    } else if (phase !== BETWEEN) {
      // The shape in its box (page units: document px / zoom, +y up); entering or exiting, its blocks
      // stream down into or out of the box's band, staggered. Between stops nothing shows.
      fillShape(stop.shape, scratch.placed, shape);
      placePoses(scratch.placed, stop.x / zoom, -stop.y / zoom, stop.scale);
      poses = scratch.placed;
      if (phase === ENTERING || phase === EXITING) {
        const top = -stop.safe.top / zoom;
        const bottom = -stop.safe.bottom / zoom;
        streamPoses(stop.shape, scratch.placed, scratch.out, k, phase === ENTERING ? "in" : "out", top, bottom);
        poses = scratch.out;
      }
      // The clipped box follows the blocks, inside the stop's band.
      clip = clipBox(poses, zoom, stop.safe, state.size.width, state.size.height);
    }

    if (!sameRect(clip, m.box)) {
      m.box = clip;
      placeBox(box, clip);
    }

    // The canvas fills the box from its top-left corner; the camera looks at the canvas's centre.
    const originX = (clip.left + state.size.width / 2) / zoom;
    const originY = -(clip.top + state.size.height / 2) / zoom;
    if (heroShows) {
      mesh.position.set(stop.x / zoom - originX, -stop.y / zoom - originY, 0);
      mesh.rotation.set(
        m.turnX + SWAY_PITCH * wave(swayTime, SWAY_PITCH_PERIOD),
        m.turnY + SWAY_YAW * wave(swayTime, SWAY_YAW_PERIOD),
        0,
      );
    } else {
      mesh.position.set(-originX, -originY, 0);
      mesh.rotation.set(0, 0, 0);
    }

    // Instances: the whole portrait in the hero (written once while it holds), the companion's 100 elsewhere.
    const rest = poses === PORTRAIT_REST;
    if (poses && clip !== EMPTY && !(rest && m.restWritten)) {
      const { matrix } = scratch;
      const look = mesh.geometry.getAttribute("instanceLook");
      const count = heroShows ? PORTRAIT_BLOCKS : BLOCKS;
      for (let i = 0; i < count; i++) {
        const pose = poses[i];
        mesh.setMatrixAt(i, matrix.compose(pose.position, pose.quaternion, pose.scale));
        look.setXYZW(i, pose.glow, pose.shade, pose.portrait, pose.opacity);
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      look.needsUpdate = true;
      m.restWritten = rest;
    }

    // Report ready once a real frame has been drawn.
    if (m.frames < 2 && ++m.frames === 2) onReady();

    // Next frame: straight away while scroll moves the companion or the turn eases; a timed frame while the
    // portrait holds or live actions play on screen; otherwise none until scroll, a resize or the pointer.
    const onScreen =
      clip.right > clip.left && clip.top < window.scrollY + window.innerHeight && clip.bottom > window.scrollY;
    const looping = holding || formed || m.live > 0;
    const turning =
      Math.abs(m.turnX - turnXTarget) > TURN_SETTLED || Math.abs(m.turnY - turnYTarget) > TURN_SETTLED;
    m.sleeping = false;
    window.clearTimeout(timer.current);
    if (m.frames < 2 || m.progress !== target || turning) {
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
    <instancedMesh ref={meshRef} args={[undefined, undefined, PORTRAIT_BLOCKS]} frustumCulled={false}>
      <boxGeometry args={[BLOCK, BLOCK, BLOCK]}>
        <instancedBufferAttribute attach="attributes-instanceLook" args={[lookArray, 4]} />
      </boxGeometry>
      {/* Transparent only so the portrait's falling blocks can fade; everything else is opaque. */}
      <shaderMaterial transparent uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </instancedMesh>
  );
}

type PartsCubeProps = {
  /** The hero visual's box: the portrait's position and size at scroll 0. */
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
