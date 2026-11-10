import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Color, MathUtils, Matrix4, Vector3, type InstancedMesh, type ShaderMaterial } from "three";
import { BLOCKS, blendPoses, createPoses, fillLayout, type LayoutInput } from "./build-layouts";
import { buildProgress, measureBuild, type BuildMap } from "./build-scroll";

/*
 * "The Build": the hero's "systems from parts" cube as a scroll companion. A 3×3×3 cube of blocks
 * (26 instances, the hidden centre is dropped) drawn in one draw call with no textures, in one fixed
 * canvas on the right of the viewport, behind the page content. At scroll 0 it sits exactly over the
 * hero poster; as the page scrolls, its blocks rearrange into one layout per section (build-layouts.ts),
 * scrubbed by scroll and reversible (build-scroll.ts). In the hero it turns slowly, separates under the
 * pointer, and gently separates and reassembles after a few seconds without interaction.
 * Renders on demand: every frame while something eases, ~30 fps while only the hero spin or the About
 * float moves, and not at all while a section's layout is at rest. Only loaded lazily by HeroVisual.
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

const BLOCK = 0.6;
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
const PROGRESS_SETTLED = 1e-3; // of one move: well under a pixel
const RING_RAD_PER_PX = 0.0008;

// While only the spin or float moves: small enough steps at 30 fps not to read as stutter.
const TIMED_FRAME_MS = 33;
// "Close enough" for the eased values: under ~0.1px of block movement for separation, ~0.2px for tilt.
const SEPARATION_SETTLED = 5e-3;
const TILT_SETTLED = 1e-3;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

// Accent edges from the face UVs (about 1.5 device px wide at any DPR) over a softly shaded surface.
const fragmentShader = /* glsl */ `
  uniform vec3 uAccent;
  uniform vec3 uSurface;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec2 d = min(vUv, 1.0 - vUv);
    float edge = min(d.x, d.y);
    float px = fwidth(edge);
    float line = 1.0 - smoothstep(px, px * 2.0, edge);
    float light = 0.8 + 0.2 * dot(normalize(vNormal), normalize(vec3(0.3, 0.8, 0.5)));
    // Mixed in linear space, so a small accent share already reads clearly after sRGB output.
    vec3 face = mix(uSurface, uAccent, 0.025) * light;
    gl_FragColor = vec4(mix(face, uAccent, line), 1.0);
    #include <colorspace_fragment>
  }
`;

// Reused every frame (there is only ever one companion), so a frame allocates nothing.
const scratch = {
  from: createPoses(),
  to: createPoses(),
  out: createPoses(),
  matrix: new Matrix4(),
  position: new Vector3(),
  scale: new Vector3(),
};

function readTokenColors(target: { uAccent: { value: Color }; uSurface: { value: Color } }) {
  const styles = getComputedStyle(document.documentElement);
  target.uAccent.value.setStyle(styles.getPropertyValue("--accent").trim());
  target.uSurface.value.setStyle(styles.getPropertyValue("--surface").trim());
}

type MotionState = { separation: number; tiltX: number; tiltY: number };

/** True while any eased value is still visibly short of its target. */
function isEasing(m: MotionState, separation: number, tiltX: number, tiltY: number): boolean {
  return (
    Math.abs(m.separation - separation) > SEPARATION_SETTLED ||
    Math.abs(m.tiltX - tiltX) > TILT_SETTLED ||
    Math.abs(m.tiltY - tiltY) > TILT_SETTLED
  );
}

type BlocksProps = {
  mapRef: RefObject<BuildMap | null>;
  pointerRef: RefObject<PointerState>;
  visible: boolean;
  onReady: () => void;
};

function Blocks({ mapRef, pointerRef, visible, onReady }: BlocksProps) {
  const invalidate = useThree((state) => state.invalidate);
  const visibleRef = useRef(visible);
  const timer = useRef<number | undefined>(undefined);
  const meshRef = useRef<InstancedMesh>(null);
  const themeDirty = useRef(true);
  const motion = useRef({ separation: 0, tiltX: 0, tiltY: 0, spin: 0, progress: -1, frames: 0 });
  const [uniforms] = useState(() => ({ uAccent: { value: new Color() }, uSurface: { value: new Color() } }));

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

  // Scroll asks for at most one frame per animation frame; the frame reads scrollY itself.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        invalidate();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [invalidate]);

  // The tab visible again: restart the frame chain.
  useEffect(() => {
    visibleRef.current = visible;
    if (visible) invalidate();
    else window.clearTimeout(timer.current);
  }, [visible, invalidate]);

  useFrame((state, rawDelta) => {
    const mesh = meshRef.current;
    const map = mapRef.current;
    if (!mesh || !map || map.stops.length === 0) return;

    // Orthographic zoom is px per world unit: the hero cube keeps the poster's size.
    if (state.camera.zoom !== map.zoom) {
      state.camera.zoom = map.zoom;
      state.camera.updateProjectionMatrix();
    }

    if (themeDirty.current) {
      readTokenColors((mesh.material as ShaderMaterial).uniforms as typeof uniforms);
      themeDirty.current = false;
    }

    // Clamp so resuming after a pause doesn't jump.
    const delta = Math.min(rawDelta, 0.1);
    const m = motion.current;
    const pointer = pointerRef.current;
    const now = performance.now();
    const { stops } = map;

    // Where the page is between section layouts.
    const target = buildProgress(window.scrollY, map);
    m.progress = m.progress < 0 ? target : MathUtils.damp(m.progress, target, PROGRESS_EASE, delta);
    if (Math.abs(m.progress - target) < PROGRESS_SETTLED) m.progress = target;
    const index = Math.min(Math.floor(m.progress), stops.length - 1);
    const t = m.progress - index;
    const from = stops[index];
    const to = stops[Math.min(index + 1, stops.length - 1)];
    const heroWeight = index === 0 ? 1 - t : 0;
    const floating = from.layout === "cluster" || (to.layout === "cluster" && t > 0);

    // Hero only: pointer separation and tilt, the idle breathing and the spin fade out as it leaves.
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

    const input: LayoutInput = {
      spin: m.spin,
      tiltX: m.tiltX,
      tiltY: m.tiltY,
      separation: m.separation,
      ringAngle: window.scrollY * RING_RAD_PER_PX,
      time: now / 1000,
    };
    fillLayout(from.layout, scratch.from, input);
    fillLayout(to.layout, scratch.to, input);
    blendPoses(scratch.from, scratch.to, t, scratch.out);

    // The companion's centre (layer px → world units) and size move with the same eased t.
    const eased = MathUtils.smoothstep(t, 0, 1);
    const size = MathUtils.lerp(from.scale, to.scale, eased);
    const centreX = (MathUtils.lerp(from.x, to.x, eased) - state.size.width / 2) / map.zoom;
    const centreY = -(MathUtils.lerp(from.y, to.y, eased) - state.size.height / 2) / map.zoom;

    const { matrix, position, scale } = scratch;
    for (let i = 0; i < BLOCKS; i++) {
      const pose = scratch.out[i];
      position.copy(pose.position).multiplyScalar(size);
      position.x += centreX;
      position.y += centreY;
      scale.copy(pose.scale).multiplyScalar(size);
      mesh.setMatrixAt(i, matrix.compose(position, pose.quaternion, scale));
    }
    mesh.instanceMatrix.needsUpdate = true;

    // Report ready once a real frame has been drawn.
    if (m.frames < 2 && ++m.frames === 2) onReady();

    // Next frame: straight away while anything eases; a timed frame while the hero spins or About
    // floats; otherwise none until scroll, resize or the pointer asks.
    window.clearTimeout(timer.current);
    if (m.frames < 2 || m.progress !== target || isEasing(m, separation, tiltXTarget, tiltYTarget)) {
      state.invalidate();
    } else if (heroWeight > 0 || floating) {
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
  const [layerLeft, setLayerLeft] = useState<number | null>(null);
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
      setLayerLeft(map.layerLeft);
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

  if (layerLeft === null) return null;

  // Fixed on the right, behind all page content (the body's background is the viewport's, so the
  // layer still paints above it). Cards pass over it; marked text never sits in front of it.
  return createPortal(
    <div
      aria-hidden="true"
      data-ready={ready || undefined}
      className="pointer-events-none fixed inset-y-0 right-0 -z-1 opacity-0 transition-opacity duration-400 data-ready:opacity-100"
      style={{ left: layerLeft }}
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
          pointerRef={pointerRef}
          visible={visible}
          onReady={() => {
            setReady(true);
            onReady();
          }}
        />
      </Canvas>
    </div>,
    document.body,
  );
}
