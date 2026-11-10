"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState, type PointerEvent, type RefObject } from "react";
import { LoopOnce, MathUtils, type AnimationAction, type Group } from "three";
import type { ArCreature } from "@/content/xr";
import { cx } from "@/lib/cx";
import { disposeCreatures, loadCreature, type LoadedCreature } from "./creature-models";

/*
 * The AR Elemental Arena summon scene on the home card's phone screen (desktop only, loaded lazily by
 * CreatureStage when the card is first seen). A creature stands over its summon card. Drag to turn it,
 * click (or the Animate button) to play its next clip once, and switch element with the chips. SCAN:
 * tracking corners lock onto the card and one sweep runs down it the first time.
 * Renders on demand: every frame while dragging, easing the spin back in or playing a move, else ~30 fps
 * for the idle loop and slow spin. Nothing renders off-screen or in a hidden tab.
 */

const SPIN_SPEED = 0.35; // rad/s
const SPIN_EASE = 2; // damp lambda: ~95% of full speed in 1.5s
const RESUME_AFTER_MS = 1500;
const DRAG_RAD_PER_PX = 0.012;
const CLICK_SLOP_PX = 4;
const FADE_S = 0.2; // clip crossfade
const IDLE_FRAME_MS = 33;
const START_YAW = -0.5;

// Neutral studio light: the models' own flat colours carry the look.
const SKY_LIGHT = 0xffffff;
const GROUND_LIGHT = 0x3a3a3a;

// Lock-on, after the stage's 200ms crossfade from the screenshot.
const ENTER_MS = 200;
const FIRST_FADE_DELAY_MS = 250;
const CREATURE_FADE_MS = 400;
const LOCK_MS = 300;

// Once per page load, even if the viewer remounts.
let swept = false;

type Control = {
  dragging: boolean;
  /** Radians from drag moves not yet applied. */
  rotateBy: number;
  /** performance.now() when the last drag ended. */
  releasedAt: number;
  wake?: () => void;
  animate?: () => void;
};

type CreatureModelProps = {
  creature: LoadedCreature;
  controlRef: RefObject<Control>;
  active: boolean;
};

function CreatureModel({ creature, controlRef, active }: CreatureModelProps) {
  const invalidate = useThree((state) => state.invalidate);
  const spinRef = useRef<Group>(null);
  const timer = useRef<number | undefined>(undefined);
  const activeRef = useRef(active);
  const motion = useRef({ speed: SPIN_SPEED, busyUntil: 0, frames: 0 });

  // Rest loop, and the clip cycle for clicks and the Animate button.
  useEffect(() => {
    const control = controlRef.current;
    const { mixer, rest, moves } = creature;
    const restAction = mixer.clipAction(rest);
    restAction.reset().play();
    let current: AnimationAction = restAction;
    let next = 0;

    control.animate = () => {
      if (moves.length === 0) return;
      const clip = moves[next++ % moves.length];
      const action = mixer.clipAction(clip);
      // The mixer caches one action per clip and won't restart a finished one: reset() on every switch.
      action.reset().setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      action.fadeIn(FADE_S).play();
      if (current !== action) current.fadeOut(FADE_S);
      current = action;
      motion.current.busyUntil = performance.now() + (clip.duration + FADE_S) * 1000;
      invalidate();
    };

    const onFinished = (event: { action: AnimationAction }) => {
      if (event.action !== current || current === restAction) return;
      restAction.reset().fadeIn(FADE_S).play();
      current.fadeOut(FADE_S);
      current = restAction;
      motion.current.busyUntil = performance.now() + FADE_S * 1000;
    };
    mixer.addEventListener("finished", onFinished);
    motion.current.frames = 0;
    invalidate();

    return () => {
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
      control.animate = undefined;
    };
  }, [creature, controlRef, invalidate]);

  useEffect(() => {
    const control = controlRef.current;
    control.wake = invalidate;
    return () => {
      control.wake = undefined;
      window.clearTimeout(timer.current);
    };
  }, [controlRef, invalidate]);

  // Back on screen (or the tab visible again): restart the frame chain.
  useEffect(() => {
    activeRef.current = active;
    if (active) invalidate();
    else window.clearTimeout(timer.current);
  }, [active, invalidate]);

  useFrame((state, rawDelta) => {
    const spin = spinRef.current;
    if (!spin) return;

    // Clamp so resuming after a pause doesn't jump.
    const delta = Math.min(rawDelta, 0.1);
    const now = performance.now();
    const m = motion.current;
    const control = controlRef.current;
    creature.mixer.update(delta);

    // Auto-spin stops while dragging and eases back in a moment after release.
    const holding = control.dragging || now - control.releasedAt < RESUME_AFTER_MS;
    const target = holding ? 0 : SPIN_SPEED;
    m.speed = MathUtils.damp(m.speed, target, SPIN_EASE, delta);
    spin.rotation.y += control.rotateBy + m.speed * delta;
    control.rotateBy = 0;
    m.frames++;

    window.clearTimeout(timer.current);
    if (m.frames < 2 || control.dragging || now < m.busyUntil || Math.abs(m.speed - target) > 1e-3) {
      state.invalidate();
    } else {
      timer.current = window.setTimeout(() => {
        if (activeRef.current) invalidate();
      }, IDLE_FRAME_MS);
    }
  });

  return (
    <group ref={spinRef} rotation={[0, START_YAW, 0]}>
      <primitive object={creature.root} />
    </group>
  );
}

export type CreatureViewerLabels = {
  /** One caption per creature, in the same order. */
  captions: readonly string[];
  animate: string;
  chooseLabel: string;
};

type CreatureViewerProps = {
  creatures: readonly ArCreature[];
  labels: CreatureViewerLabels;
  /** False when off-screen or the tab is hidden: rendering stops entirely. */
  active: boolean;
  /** True once the first creature and its card are ready to show; false on unmount. */
  onReadyChange: (ready: boolean) => void;
  onFail: () => void;
};

export function CreatureViewer({ creatures, labels, active, onReadyChange, onFail }: CreatureViewerProps) {
  const [selected, setSelected] = useState(0);
  const [visited, setVisited] = useState<readonly number[]>([0]);
  const [cardsLoaded, setCardsLoaded] = useState<readonly number[]>([]);
  const [shown, setShown] = useState<{ index: number; creature: LoadedCreature } | null>(null);
  const [entered, setEntered] = useState(false);
  const controlRef = useRef<Control>({ dragging: false, rotateBy: 0, releasedAt: -Infinity });
  const drag = useRef<{ x: number; moved: number } | null>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  const fail = useEffectEvent(onFail);
  const reportReady = useEffectEvent(onReadyChange);

  // Each model loads when first chosen; switching back uses the cache.
  useEffect(() => {
    let cancelled = false;
    const { model, restClip } = creatures[selected];
    loadCreature(model, restClip).then(
      (creature) => {
        if (!cancelled) setShown({ index: selected, creature });
      },
      () => {
        if (!cancelled) fail();
      },
    );
    return () => {
      cancelled = true;
    };
  }, [creatures, selected]);

  // Free every model on unmount (motion switched off, or the window became too small).
  useEffect(
    () => () => {
      reportReady(false);
      disposeCreatures();
    },
    [],
  );

  const tracked = shown?.index === selected && cardsLoaded.includes(selected);

  // The first time: tell the stage to crossfade from the screenshot, then lock on once that's done.
  useEffect(() => {
    if (!tracked || entered) return;
    reportReady(true);
    const id = window.setTimeout(() => setEntered(true), ENTER_MS);
    return () => window.clearTimeout(id);
  }, [tracked, entered]);

  const locked = tracked && entered;
  const shownIndex = shown?.index;

  // SCAN lock-on for each summon: corners grow in, the creature fades in, and (once) the sweep.
  useEffect(() => {
    if (!locked) return;
    const first = !swept;
    if (first && lineRef.current) {
      swept = true;
      lineRef.current.dataset.run = "";
    }
    cornersRef.current?.animate(
      [
        { "--c-len": "6px", opacity: 0.4 },
        { "--c-len": "18px", opacity: 1 },
      ],
      { duration: LOCK_MS, easing: "ease-out" },
    );
    fadeRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: CREATURE_FADE_MS,
      delay: first ? FIRST_FADE_DELAY_MS : 0,
      easing: "ease-out",
      fill: "backwards",
    });
  }, [locked, shownIndex]);

  const choose = (index: number) => {
    setSelected(index);
    setVisited((list) => (list.includes(index) ? list : [...list, index]));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, moved: 0 };
    controlRef.current.dragging = true;
    controlRef.current.wake?.();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    current.x = event.clientX;
    current.moved += Math.abs(dx);
    controlRef.current.rotateBy += dx * DRAG_RAD_PER_PX;
    controlRef.current.wake?.();
  };

  const endDrag = (click: boolean) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    const control = controlRef.current;
    control.dragging = false;
    control.releasedAt = performance.now();
    if (click && current.moved < CLICK_SLOP_PX) control.animate?.();
    control.wake?.();
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-bg">
      {/* The summon card, the creature over it, and the SCAN lock. Decorative: the caption says what it is. */}
      <div aria-hidden="true" className="relative mx-3 mt-3 aspect-[912/1264]">
        {visited.map((index) => {
          const { card } = creatures[index];
          return (
            <Image
              key={card.src}
              src={card.src}
              alt=""
              width={card.width}
              height={card.height}
              sizes="200px"
              loading="eager"
              onLoad={() => setCardsLoaded((list) => (list.includes(index) ? list : [...list, index]))}
              className={cx(
                "absolute inset-0 size-full rounded-md object-cover transition-opacity duration-200",
                index === selected ? "opacity-100" : "opacity-0",
              )}
            />
          );
        })}

        <div
          ref={fadeRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => endDrag(true)}
          onPointerCancel={() => endDrag(false)}
          className={cx(
            "absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing",
            locked ? "opacity-100" : "opacity-0",
          )}
        >
          <Canvas
            aria-hidden="true"
            camera={{ fov: 30, position: [0, 1.15, 5.6] }}
            dpr={[1, 1.5]}
            flat
            frameloop={active ? "demand" : "never"}
            gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
            onCreated={({ camera, gl }) => {
              camera.lookAt(0, 0.8, 0);
              gl.domElement.addEventListener("webglcontextlost", onFail, { once: true });
            }}
          >
            <hemisphereLight args={[SKY_LIGHT, GROUND_LIGHT, 2.2]} />
            <directionalLight position={[2, 4, 3]} intensity={1.6} />
            {shown && <CreatureModel creature={shown.creature} controlRef={controlRef} active={active} />}
          </Canvas>
        </div>

        <span className="pointer-events-none absolute -inset-1">
          <span className="absolute inset-0 overflow-hidden">
            <span ref={lineRef} className="lock-line" />
          </span>
          <span ref={cornersRef} className="lock-corners" data-lock={locked ? "locked" : "seeking"} />
        </span>
      </div>

      <div className="mt-auto space-y-2 p-2.5">
        <div role="group" aria-label={labels.chooseLabel} className="grid grid-cols-2 gap-1.5">
          {creatures.map((creature, index) => (
            <button
              key={creature.element}
              type="button"
              aria-pressed={index === selected}
              onClick={() => choose(index)}
              className={cx(
                "rounded-md border px-2 py-1 font-mono text-xs transition-colors duration-150",
                index === selected
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border bg-surface text-text hover:border-accent",
              )}
            >
              {creature.element}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => controlRef.current.animate?.()}
          className="w-full rounded-md border border-accent/40 px-2 py-1 font-mono text-xs text-accent transition-colors duration-150 hover:border-accent"
        >
          {labels.animate}
        </button>
        <p aria-live="polite" className="text-xs leading-snug text-text-muted">
          {labels.captions[selected]}
        </p>
      </div>
    </div>
  );
}
