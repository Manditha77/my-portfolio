import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { MathUtils, Matrix4, Vector3, type InstancedMesh, type ShaderMaterial } from "three";
import { createBlockUniforms, fragmentShader, readTokenColors, vertexShader, type BlockUniforms } from "./build-material";
import { BLOCK, BLOCKS, REST, blendPoses, createPoses, fillShape, type Pose, type PoseInput } from "./build-poses";
import { EDGE_SCALE, buildProgress, measureBuild, type BuildMap, type Stop } from "./build-scroll";

/*
 * "The Build": the hero's "systems from parts" cube as a scroll companion. 100 instanced blocks in one
 * draw call with no textures. Each home section has a free box beside its heading (build-scroll.ts); the
 * canvas sits in the current box, behind the page content and clipped to it, so it scrolls with the page
 * and can never draw over text or a card. As a box scrolls in, the blocks travel from the previous
 * section's shape into this one's (build-shapes.ts), staggered so the shape assembles in parts; as the
 * section's cards arrive, the shape shrinks and fades. Scrubbed by scroll and reversible.
 * In the hero the cube turns slowly, separates under the pointer, and gently separates and reassembles
 * after a few seconds without interaction. About's person waves once when it first completes.
 * Renders on demand: every frame while something eases, ~30 fps while only the hero spins, and not at
 * all while a shape is at rest. Only loaded lazily by HeroVisual.
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

// About's wave: two swings of the raised arm, fading out.
const WAVE_MS = 1400;
const WAVE_ANGLE = 0.4; // rad

// While only the hero spin moves: small enough steps at 30 fps not to read as stutter.
const TIMED_FRAME_MS = 33;
// "Close enough" for the eased values: under ~0.1px of block movement for separation, ~0.2px for tilt.
const SEPARATION_SETTLED = 5e-3;
const TILT_SETTLED = 1e-3;

// Reused every frame (there is only ever one companion), so a frame allocates nothing.
const scratch = {
  from: createPoses(),
  to: createPoses(),
  out: createPoses(),
  input: { ...REST } as PoseInput,
  matrix: new Matrix4(),
  position: new Vector3(),
  scale: new Vector3(),
};

type MotionState = { separation: number; tiltX: number; tiltY: number };

/** True while any eased value is still visibly short of its target. */
function isEasing(m: MotionState, separation: number, tiltX: number, tiltY: number): boolean {
  return (
    Math.abs(m.separation - separation) > SEPARATION_SETTLED ||
    Math.abs(m.tiltX - tiltX) > TILT_SETTLED ||
    Math.abs(m.tiltY - tiltY) > TILT_SETTLED
  );
}

/** Moves the clipped box onto `stop`'s free box (document px). */
function placeBox(box: HTMLElement, stop: Stop) {
  box.style.left = `${stop.left}px`;
  box.style.top = `${stop.top}px`;
  box.style.width = `${stop.width}px`;
  box.style.height = `${stop.height}px`;
}

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
    stop: null as Stop | null,
    opacity: "",
    /** performance.now() when the wave started; -1 before it, Infinity once it has played. */
    waveStart: -1,
  });
  const [uniforms] = useState(createBlockUniforms);

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

  // Scroll asks for at most one frame per animation frame, and only when the scroll moved a shape:
  // while a shape is formed (or between shapes) its box just scrolls with the page.
  useEffect(() => {
    let frame = 0;
    let last = -1;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const map = mapRef.current;
        const target = map ? buildProgress(window.scrollY, map) : -1;
        if (target === last) return;
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

    // Orthographic zoom is px per world unit: the hero cube keeps the poster's size.
    if (state.camera.zoom !== map.zoom) {
      state.camera.zoom = map.zoom;
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
    const { stops } = map;

    // Which shape, and where it is in its enter → formed → leave phases.
    const target = buildProgress(window.scrollY, map);
    m.progress = m.progress < 0 ? target : MathUtils.damp(m.progress, target, PROGRESS_EASE, delta);
    if (Math.abs(m.progress - target) < PROGRESS_SETTLED) m.progress = target;
    const index = Math.floor(m.progress);
    const phase = m.progress - index;
    const stop = stops[index];
    const entered = Math.min(1, phase * 2); // 0..1 while entering, then 1
    const left = Math.max(0, phase * 2 - 1); // 0 while formed, 0..1 while leaving

    // The box only moves at a zero-opacity moment: the end of one shape's exit is the start of the next's enter.
    if (stop && m.stop !== stop) {
      m.stop = stop;
      placeBox(box, stop);
    }
    const opacity = stop
      ? String(MathUtils.smoothstep(entered, 0, 0.35) * (1 - MathUtils.smoothstep(left, 0.3, 1)))
      : "0";
    if (opacity !== m.opacity) {
      m.opacity = opacity;
      box.style.opacity = opacity;
    }

    // Hero only: pointer separation and tilt, the idle breathing and the spin fade out as it leaves.
    const heroWeight = index === 0 ? 1 - left : 0;
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
    m.spin += SPIN_SPEED * delta * heroWeight;

    // About: the person waves once per page load, the first time it is fully formed.
    if (stop?.shape === "person" && entered === 1 && m.waveStart === -1) m.waveStart = now;
    const waveT = m.waveStart >= 0 && Number.isFinite(m.waveStart) ? (now - m.waveStart) / WAVE_MS : -1;
    const waving = waveT >= 0 && waveT < 1;
    if (waveT >= 1) m.waveStart = Infinity;

    if (stop) {
      const input = scratch.input;
      input.spin = index === 0 ? m.spin : 0;
      input.tiltX = index === 0 ? m.tiltX : 0;
      input.tiltY = index === 0 ? m.tiltY : 0;
      input.separation = index === 0 ? m.separation : 0;
      input.wave = waving ? WAVE_ANGLE * Math.sin(waveT * Math.PI * 4) * (1 - waveT) : 0;
      // Skills' last tile drops into its slot over the end of the enter.
      input.settle = MathUtils.smoothstep(entered, 0.75, 1);
      fillShape(stop.shape, scratch.to, input);

      // Entering: the blocks travel from the previous shape, staggered.
      let poses: Pose[] = scratch.to;
      if (entered < 1 && index > 0) {
        fillShape(stops[index - 1].shape, scratch.from, REST);
        blendPoses(scratch.from, scratch.to, entered, scratch.out);
        poses = scratch.out;
      }

      // The shape's centre is the box's centre; the canvas fills the box from its top-left corner.
      const size = stop.scale * MathUtils.lerp(EDGE_SCALE, 1, MathUtils.smoothstep(entered - left, 0, 1));
      const centreX = (stop.width / 2 - state.size.width / 2) / map.zoom;
      const centreY = -(stop.height / 2 - state.size.height / 2) / map.zoom;

      const { matrix, position, scale } = scratch;
      for (let i = 0; i < BLOCKS; i++) {
        const pose = poses[i];
        position.copy(pose.position).multiplyScalar(size);
        position.x += centreX;
        position.y += centreY;
        scale.copy(pose.scale).multiplyScalar(size);
        mesh.setMatrixAt(i, matrix.compose(position, pose.quaternion, scale));
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Report ready once a real frame has been drawn.
    if (m.frames < 2 && ++m.frames === 2) onReady();

    // Next frame: straight away while anything eases or the person waves; a timed frame while the hero
    // spins; otherwise none until scroll moves a shape, a resize or the pointer asks.
    window.clearTimeout(timer.current);
    if (m.frames < 2 || m.progress !== target || waving || isEasing(m, separation, tiltXTarget, tiltYTarget)) {
      state.invalidate();
    } else if (heroWeight > 0) {
      timer.current = window.setTimeout(() => {
        if (visibleRef.current) invalidate();
      }, TIMED_FRAME_MS);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BLOCKS]} frustumCulled={false}>
      <boxGeometry args={[BLOCK, BLOCK, BLOCK]} />
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

  // Absolutely positioned in the document at the current free box (set per frame), clipped to it and
  // behind all page content. The canvas inside keeps the largest box's size, so moving between boxes
  // never reallocates it.
  return createPortal(
    <div
      ref={boxRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 -z-1 overflow-hidden opacity-0"
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
