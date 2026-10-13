import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Color, MathUtils, Matrix4, type Group, type InstancedMesh, type ShaderMaterial } from "three";

/*
 * "Systems from parts": a 3×3×3 cube of blocks (26 instances, the hidden centre is dropped) drawn in
 * one draw call with no textures. It starts at the poster's exact orientation so the crossfade is
 * seamless, turns slowly, and separates into its modules while the pointer moves over it.
 * Only loaded lazily by HeroVisual.
 */

export type PointerState = {
  /** -1..1 across the visual, +y up. */
  x: number;
  y: number;
  inside: boolean;
  /** performance.now() of the last pointermove. */
  lastMove: number;
};

// Must match HeroPoster's projection (YAW, PITCH) and outer cube (half-size 1 at ¼ of the width).
const YAW = 0.6;
const PITCH = 0.45;
const VIEW_UNITS = 4;

const BLOCK = 0.6;
const SPACING = 0.667;
// Kept small so a fully separated cube's diagonal still fits inside the canvas.
const SPREAD = 0.25;
const SPIN_SPEED = 0.15; // rad/s
const MAX_TILT = 0.15; // rad
const EASE = 6; // damp lambda: ~95% of the way in 0.5s
const SETTLE_AFTER_MS = 1200;

const GRID: [number, number, number][] = [];
for (const x of [-1, 0, 1]) {
  for (const y of [-1, 0, 1]) {
    for (const z of [-1, 0, 1]) if (x || y || z) GRID.push([x * SPACING, y * SPACING, z * SPACING]);
  }
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
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

function readTokenColors(target: { uAccent: { value: Color }; uSurface: { value: Color } }) {
  const styles = getComputedStyle(document.documentElement);
  target.uAccent.value.setStyle(styles.getPropertyValue("--accent").trim());
  target.uSurface.value.setStyle(styles.getPropertyValue("--surface").trim());
}

type BlocksProps = {
  pointerRef: RefObject<PointerState>;
  onReady: () => void;
};

function Blocks({ pointerRef, onReady }: BlocksProps) {
  const tiltRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);
  const meshRef = useRef<InstancedMesh>(null);
  const themeDirty = useRef(true);
  const motion = useRef({ separation: -1, tiltX: 0, tiltY: 0, frames: 0 });
  const [uniforms] = useState(() => ({ uAccent: { value: new Color() }, uSurface: { value: new Color() } }));
  const [matrix] = useState(() => new Matrix4());

  // Recolour when the theme toggle (or the OS theme) changes data-theme on <html>.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      themeDirty.current = true;
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useFrame((state, rawDelta) => {
    const mesh = meshRef.current;
    const tilt = tiltRef.current;
    const spin = spinRef.current;
    if (!mesh || !tilt || !spin) return;

    // Orthographic zoom is px per world unit: keep VIEW_UNITS across the canvas, like the poster.
    const zoom = state.size.width / VIEW_UNITS;
    if (state.camera.zoom !== zoom) {
      state.camera.zoom = zoom;
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
    const moving = pointer.inside && performance.now() - pointer.lastMove < SETTLE_AFTER_MS;

    const previous = m.separation;
    m.separation = MathUtils.damp(Math.max(previous, 0), moving ? 1 : 0, EASE, delta);
    m.tiltX = MathUtils.damp(m.tiltX, pointer.inside ? -pointer.y * MAX_TILT : 0, EASE, delta);
    m.tiltY = MathUtils.damp(m.tiltY, pointer.inside ? pointer.x * MAX_TILT : 0, EASE, delta);

    // Rotate around Y, then X (as the poster does): outer group pitches, inner group yaws.
    tilt.rotation.x = PITCH + m.tiltX;
    spin.rotation.y += SPIN_SPEED * delta;
    tilt.rotation.y = m.tiltY;

    if (Math.abs(m.separation - previous) > 1e-4) {
      const scale = 1 + SPREAD * m.separation;
      GRID.forEach(([x, y, z], i) => mesh.setMatrixAt(i, matrix.makeTranslation(x * scale, y * scale, z * scale)));
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Report ready once a real frame has been drawn.
    if (m.frames < 2 && ++m.frames === 2) onReady();
  });

  return (
    <group ref={tiltRef} rotation={[PITCH, 0, 0]}>
      <group ref={spinRef} rotation={[0, YAW, 0]}>
        <instancedMesh ref={meshRef} args={[undefined, undefined, GRID.length]} frustumCulled={false}>
          <boxGeometry args={[BLOCK, BLOCK, BLOCK]} />
          <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
        </instancedMesh>
      </group>
    </group>
  );
}

type PartsCubeProps = BlocksProps & {
  /** False when off-screen or the tab is hidden: rendering stops entirely. */
  active: boolean;
  onFail: () => void;
};

export function PartsCube({ active, pointerRef, onReady, onFail }: PartsCubeProps) {
  return (
    <Canvas
      aria-hidden="true"
      orthographic
      camera={{ position: [0, 0, 10], zoom: 100 }}
      dpr={[1, 1.5]}
      flat
      frameloop={active ? "always" : "never"}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onFail, { once: true });
      }}
    >
      <Blocks pointerRef={pointerRef} onReady={onReady} />
    </Canvas>
  );
}
