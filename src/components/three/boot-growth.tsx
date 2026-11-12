import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Euler, Matrix4, Quaternion, Vector3, type InstancedMesh, type ShaderMaterial } from "three";
import { BOOT, BOOT_3D, bootState } from "@/lib/boot";
import { GROWTH_CELLS, growthAt, type GrowthState } from "@/lib/boot-growth";
import { BUILD_SHAPES, DEFAULT_BLOCK, DEFAULT_VIEW } from "@/lib/build-shapes";
import { cubicBezier, duration, easeOut } from "@/lib/motion-tokens";
import { createBlockUniforms, fragmentShader, readTokenColors, vertexShader, type BlockUniforms } from "./build-material";
import { BLOCK } from "./build-poses";

/*
 * The cube boot's core growth in 3D, on capable desktops only (BootGrowthGate). The poster's SVG growth
 * always plays (globals.css, "Cube boot"); this canvas sits exactly over the poster's cube at the viewport
 * centre (.boot-3d, sized and placed from bootMeasureScript's numbers) and draws the same 27 blocks with The
 * Build's block material, posed each frame from the boot's own CSS clock with the same timings and curves
 * (src/lib/boot-growth.ts). So whenever it is ready, it can take over mid-growth without a jump: if its
 * first frame comes before BOOT_3D.takeoverBy it goes live (data-boot-3d="live" on <html>: it fades in as
 * the poster's blocks fade out); later than that it never shows. Once the cube has settled (handBackAt,
 * still and in the poster's exact pose), it hands back to the poster, which then glides, and unmounts, so
 * its WebGL context is gone before the companion's mounts. A skip, a failure or a lost context leaves the
 * poster showing. Decorative, aria-hidden, no pointer events. Only loaded lazily by BootGrowthGate.
 */

type Phase = "warming" | "live" | "done" | "gone";

const STEP = BUILD_SHAPES.cube.step ?? 1;
const VIEW = new Quaternion().setFromEuler(
  new Euler(
    BUILD_SHAPES.cube.view?.pitch ?? DEFAULT_VIEW.pitch,
    BUILD_SHAPES.cube.view?.yaw ?? DEFAULT_VIEW.yaw,
    BUILD_SHAPES.cube.view?.roll ?? DEFAULT_VIEW.roll,
  ),
);
/** The cube's blocks, as a share of the block geometry (as the companion's hero cube draws them). */
const BLOCK_SCALE = (DEFAULT_BLOCK[0] * STEP) / BLOCK;
/** The poster rests 10px up until it settles onto the floor (boot-settle in globals.css). */
const SETTLE_PX = 10;
/** The poster's frame is 4 companion units across (src/lib/cube.ts POSTER: 400 view units, 100 per unit). */
const POSTER_UNITS = 4;

const settleCurve = cubicBezier(easeOut);

/** Desktop ms into the boot, from its CSS clock (the boot stage's no-op animation); null if there is none. */
function bootTime(): number | null {
  const stage = document.querySelector(".boot-stage");
  const clock = stage?.getAnimations().find((a) => a instanceof CSSAnimation && a.animationName === "boot-clock");
  const time = clock?.currentTime;
  if (typeof time !== "number") return null;
  const k = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--boot-k")) || 1;
  return time / k;
}

type BlocksProps = {
  /** First frame drawn, at `t` desktop ms into the boot. */
  onFirstFrame: (t: number) => void;
  /** The cube has settled: hand back to the poster. */
  onSettled: () => void;
};

function Blocks({ onFirstFrame, onSettled }: BlocksProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const drawn = useRef(false);
  const [uniforms] = useState(createBlockUniforms);
  const [glowArray] = useState(() => new Float32Array(GROWTH_CELLS.length));
  const [scratch] = useState(() => ({
    state: { slide: 0, scale: 0, glow: 0 } as GrowthState,
    matrix: new Matrix4(),
    position: new Vector3(),
    scale: new Vector3(),
  }));

  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh) readTokenColors((mesh.material as ShaderMaterial).uniforms as BlockUniforms);
  }, []);

  useFrame((frame) => {
    const mesh = meshRef.current;
    const t = bootTime();
    if (!mesh || t === null) return;

    // Orthographic zoom is px per companion unit: the canvas is the poster's frame at boot size.
    const zoom = frame.size.width / POSTER_UNITS;
    if (frame.camera.zoom !== zoom) {
      frame.camera.zoom = zoom;
      frame.camera.updateProjectionMatrix();
    }

    const settle = Math.min(1, Math.max(0, (t - BOOT.settleAt) / BOOT.settle));
    const lift = (SETTLE_PX / zoom) * (1 - settleCurve(settle));
    const { state, matrix, position, scale } = scratch;
    const glow = mesh.geometry.getAttribute("instanceGlow");
    GROWTH_CELLS.forEach((cell, i) => {
      growthAt(cell, t, state);
      const back = 1 - state.slide;
      position
        .set(cell.cell[0] + cell.from[0] * back, cell.cell[1] + cell.from[1] * back, cell.cell[2] + cell.from[2] * back)
        .multiplyScalar(STEP)
        .applyQuaternion(VIEW);
      position.y += lift;
      mesh.setMatrixAt(i, matrix.compose(position, VIEW, scale.setScalar(state.scale * BLOCK_SCALE)));
      glow.setX(i, state.glow);
    });
    mesh.instanceMatrix.needsUpdate = true;
    glow.needsUpdate = true;

    if (!drawn.current) {
      drawn.current = true;
      onFirstFrame(t);
    }
    if (t >= BOOT_3D.handBackAt) onSettled();
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, GROWTH_CELLS.length]} frustumCulled={false}>
      <boxGeometry args={[BLOCK, BLOCK, BLOCK]}>
        <instancedBufferAttribute attach="attributes-instanceGlow" args={[glowArray, 1]} />
      </boxGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </instancedMesh>
  );
}

export function BootGrowth() {
  const [phase, setPhase] = useState<Phase>("warming");

  // The poster reads the phase from <html> (globals.css); gone with this component.
  useEffect(() => {
    const root = document.documentElement;
    if (phase === "live" || phase === "done") root.setAttribute("data-boot-3d", phase);
    if (phase !== "done") return;
    // Unmount once the poster has faded back in.
    const timer = window.setTimeout(() => setPhase("gone"), duration.base);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => () => document.documentElement.removeAttribute("data-boot-3d"), []);

  if (phase === "gone") return null;

  return createPortal(
    <div aria-hidden="true" className="boot-3d">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: 100 }}
        dpr={[1, 1.5]}
        flat
        frameloop={phase === "done" ? "never" : "always"}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            () => {
              document.documentElement.removeAttribute("data-boot-3d");
              setPhase("gone");
            },
            { once: true },
          );
        }}
      >
        <Blocks
          onFirstFrame={(t) => {
            if (bootState() === "play" && t < BOOT_3D.takeoverBy) setPhase("live");
            else setPhase("gone");
          }}
          onSettled={() => setPhase((current) => (current === "live" ? "done" : current))}
        />
      </Canvas>
    </div>,
    document.body,
  );
}
