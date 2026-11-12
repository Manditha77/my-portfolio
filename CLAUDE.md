# CLAUDE.md: Manditha Madushanka Portfolio

This file is the design brief and the working rules for this repo. Read it before every task.

## 1. What this site is for

A personal portfolio for **Manditha Madushanka**, a final-year IT undergraduate at the University of Kelaniya (Sri Lanka) and former Software Engineer Intern on aeroPORT (an airline Departure Control System). He is applying for **Associate Software Engineer** roles.

**Primary audience:** recruiters and engineering managers hiring associate SEs. They skim for 30–60 seconds, often on a phone.
**Secondary audience:** people interested in his XR (VR/AR) work, and future freelance XR clients.

**Order of priority, which decides every trade-off:**
1. A recruiter understands within 5 seconds that he is a software engineer with real industry experience (Java, Spring Boot, React, microservices).
2. Fast, accessible, works perfectly on mobile.
3. The XR section stands out as a memorable differentiator. It is not the headline.
4. Visual polish and the 3D moment.

## 2. Content rules (non-negotiable)

- **All facts come from `docs/CONTENT.md`.** Never invent projects, metrics, employers, dates, skills, testimonials or results. If something is missing, leave a visible `TODO:` and tell me. Do not fill the gap.
- Content lives in typed data files under `src/content/` (e.g. `projects.ts`, `experience.ts`, `skills.ts`). Components never hard-code copy.
- Tone: modest, specific, first person, plain English. No hype words ("passionate", "rockstar", "cutting-edge", "world-class"). Prefer concrete nouns and verbs.
- Never publish his phone number or street address. Contact uses email, LinkedIn and GitHub only.
- aeroPORT is proprietary. Describe only what is in `docs/CONTENT.md`. No screenshots or code from it.
- Always credit the ElectricalSafetyVR team and third-party assets.

## 3. Stack

- **Next.js (App Router, latest stable) + TypeScript (strict)**, statically generated wherever possible.
- **Tailwind CSS** (latest), with design tokens as CSS variables.
- **Motion** (the `motion` package, formerly Framer Motion; import from `motion/react`) for UI animation.
- **React Three Fiber + @react-three/drei** for the single 3D element only.
- Video: a YouTube facade (a click-to-load thumbnail, e.g. `react-lite-youtube-embed`), using the `youtube-nocookie` domain.
- Deploy: **Vercel**. Package manager: **pnpm** (unless I say otherwise).
- Ask before adding any dependency that is not listed here.

## 4. Information architecture

Single-page home (`/`), with anchor sections in this order:

1. **Hero**: name, "Software Engineer · building VR/AR on the side", a short intro, an "Open to Associate SE roles" status, CTAs (View work, Download CV), GitHub and LinkedIn icons. Contains the one 3D element.
2. **Selected Work (SE)**: 3 full-width stacked project cards (GroceryEase, PPCH Framework, Employee Management System).
3. **VR / AR Projects** (nav "VR/AR", anchor `#vr-ar`; the old `#xr` still resolves via a hidden alias): ElectricalSafetyVR and AR Elemental Arena cards (in that order), each linking to its case study. On capable desktops the AR card's phone screenshot becomes the creature viewer (§6).
4. **Experience**: the aeroPORT internship (prominent) and leadership roles.
5. **Writing**: 2 Medium articles (small strip).
6. **Skills**: grouped, not progress bars, no percentages.
7. **About**
8. **Contact** + footer.

Additional routes:
- `/work/electrical-safety-vr`: the full case study (problem, my role, features, technical challenges, video, team credit, asset credits, repo link).
- `/work/ar-elemental-arena`: the full case study (idea, how it plays, try it yourself with the summon cards, what I built, technical challenges, what I learned, phone-frame video and gallery, credits, live demo and repo links).
- The case studies link to each other (previous/next), in the order of `xrProjects` in `src/content/xr.ts`.
- `/cv.pdf` → `public/Manditha-Madushanka-CV.pdf` (download link in the hero and nav).
- `not-found.tsx` with a link home.

The structure must make it easy to add `/xr` later as a separate XR showcase (a v2 Zesiger-style 3D world). Do not build it now.

## 5. Design direction

- Clean, confident, engineering-led. Lots of whitespace, strong type, one accent colour.
- **Inspiration only:** awwwards portfolios and zesiger.net. **Never copy** their layouts, assets, code or copy.
- **Theme:** dark by default, plus a light theme. Respect `prefers-color-scheme`, with a manual toggle stored in `localStorage` (wrapped in try/catch).
- **Tokens (CSS variables on `:root`):** `--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--accent` (a single electric cyan/teal, which nods to XR), `--accent-contrast`. Every text/background pair must meet WCAG AA contrast.
- **Typography:** one sans for UI and body (e.g. Inter or Geist via `next/font`), and one mono for small labels and tech tags (e.g. Geist Mono / JetBrains Mono). Fluid type with `clamp()`.
- **Layout:** mobile-first; max content width ~1100px; 16px side gutter on mobile; no horizontal scroll at 320px.
- **The VR / AR Projects section gets a subtle visual shift** (e.g. a faint grid/scanline background and accent glow) so it feels like entering a different "mode", while still clearly belonging to the same site.
- **Motion:** short (150–400ms), purposeful; reveal-on-scroll at most once per element. Scroll-scrubbed motion (The Build, §6) has no duration of its own; only its damping follows this range. The one timed exception is The Build's hero creation (~2 s, once per page load, §6). Nothing loops in the UI except the 3D elements (the PIPELINE caret blinks only while it types). Every effect follows the site motion switch and the Signature language (§5a).

## 5a. Signature language

The site's motion is drawn from Manditha's own projects. New motion must use one of these three motifs, or not exist.

- **ASSEMBLE** (from the hero cube, "systems from parts"): elements snap together from parts. Used by: section labels ("01 / Work") assembling character by character (`AssembleText`), the hero cube's idle pulse (it separates and reassembles every few seconds after ~4 s without input; `parts-cube.tsx`), and **The Build** (§6), one continuous companion: on page load the hero cube is created once (its blocks fly in from deep in the background and land as a thin accent **build beam** rises through it); as each home section scrolls in, the beam rises through a free box beside the heading and prints one small voxel model layer by layer; as the section scrolls away the beam falls through it and dissolves it top down, and the next section's box prints the next: Hero the assembled cube, Work a three-layer stack (database, API, UI), VR/AR a VR headset, Experience an aeroplane (the airline system), Writing an open book, Skills a tile grid whose last tile drops into its slot, About a blocky person with a VR headset pushed up on its forehead and an open laptop held in front, Contact an envelope (`src/lib/build-shapes.ts`). While formed and on screen, each model plays a small live action (§6). The **header mark** (`HeaderMark`, left of the name) is the model's dock: it shows the current model in miniature, so the object is always visible (large at a stop, small in the header). While the 3D companion runs it switches as each stop's beam starts printing and holds the shape between stops (`src/lib/build-dock.ts`); otherwise it follows the active section. It is static SVGs, drawn at build time from the same voxel data (`src/lib/build-marks.ts`, sprite route `/build-marks.svg`, `--mark-*` tokens), no WebGL, so it works on phones too (from 360px wide). A new mark builds up from the bottom in block-like rows behind a 1px accent beam while the old one drains away; with motion off it just swaps.
- **SCAN** (from AR Elemental Arena): AR tracking corners, a single scan sweep, the ring reticle. Used by: a one-time scan sweep and hover/keyboard-focus tracking corners (`ScanFrame` + `ScanObserver`) on the home page's project, VR/AR and experience cards and on the case studies' challenge cards and gallery tiles; the hero's ring reticle over a dot "surface" (`HeroReticle`, desktop only); The Build's beam (a single sweep per print or dissolve); the creature viewer's lock-on, where corners grow in around the summon card on each summon and one sweep runs the first time (`.lock-corners` / `.lock-line`, separate from the card's own `.scan-*` so the card's hover and sweep never reach them).
- **PIPELINE** (from PPCH, Sense → Analyze → Act): small steps that check, then resolve. Used by: the hero status line (`PipelineStatus`), count-up measured numbers (`CountUp`, values listed per item in `countUp` in the content files) and The Build's stack, where a request block steps UI → API → database and back, pausing at each layer.

Global rules for every effect:
- No new dependencies (Motion, CSS and small client islands only).
- Off when site motion is off (one exception: SCAN tracking corners are a hover/focus state, not motion, so they still appear with motion off, static, with no lock-on). `data-motion="on" | "off"` on `<html>` is the single switch (`src/lib/motion-pref.ts`, hook in `src/lib/use-motion-on.ts`). It is set before first paint from the stored choice, else `prefers-reduced-motion`. An explicit click on the Motion toggle wins over the OS default and is saved in `localStorage` (try/catch). CSS uses the `motion-on:` variant, never `motion-safe:`.
- Nothing delays or hides the hero h1 or intro (LCP).
- Real text is always in the DOM for screen readers and SEO; animated copies are `aria-hidden` overlays that never change layout.
- One-shot effects play once per page load. (The Build's live actions are 3D loops, not one-shots: §6.)
- Pause when off-screen or the tab is hidden.
- Desktop-only effects also need `(hover: hover)` and `(pointer: fine)`.
- The Motion toggle has a fixed accessible name ("Pause animations"), and `aria-pressed` carries the state.

## 6. 3D elements

3D is allowed only where it shows my real work. Every piece follows these rules:

- **Lazy and gated.** Load it with `next/dynamic` (`ssr: false`), and only when the gate passes: large screen with a fine hover pointer (`CAPABLE_QUERY`), site motion on, WebGL2 available and no Save-Data (helpers in `src/components/three/gate.tsx`). Phones, Motion off (`data-motion="off"`, which defaults from `prefers-reduced-motion`) and no WebGL never download the chunk or any model.
- **Poster first.** A server-rendered poster (SVG or a screenshot) renders first. It is the LCP-safe loading state and the fallback for any failure (chunk, WebGL, context loss, model fetch). The canvas takes the poster's exact place and size, so there is no layout shift.
- **Cheap to run.** DPR capped at 1.5, `frameloop="demand"` (render only while something moves), paused when off-screen or the tab is hidden, and geometries, materials and textures disposed on unmount.
- **Small assets.** Procedural where possible. Any model must be < 500 KB, load only when needed and be cached after. Use `GLTFLoader` from `three/examples/jsm`; no drei and no new dependencies.
- **Decorative canvas.** `aria-hidden`, never traps focus or scroll, and the page is fully usable without it. Any interaction also has a keyboard path through real buttons.

The pieces:

1. **The Build: the hero cube as one continuous scroll companion** (`parts-cube.tsx`, shapes `src/lib/build-shapes.ts`, poses `build-poses.ts`, live actions `build-live.ts`, material `build-material.ts`, scroll mapping `build-scroll.ts`, gate `hero-visual.tsx`). Procedural, one instanced mesh of 100 blocks, loaded when the browser is idle after first paint. It is always the same set of blocks: at each section stop the build beam (one thin plane, `build-material.ts`) rises through its box and prints that section's shape layer by layer, then falls through it and dissolves it as the section leaves. Between stops nothing shows; the header mark holds the shape.
   - **Hero creation (once per page load):** decided on the companion's first frame, only if the hero cube is formed and on screen then. Over ~2 s its blocks fly from small, scattered points inside the hero box (far depth emulated by size) and land as the beam passes them; the poster's cube fades as they start, the spin is held at the poster's angle and then eases up. Not replayed on remount (Motion toggle, client navigation). Scrolling away mid-way dissolves it like any stop.
   - **Shapes are data:** each is a low-resolution set of voxel coordinates in `build-shapes.ts` (text-row art or boxes), with an optional view angle, pieces turned about a pivot (the book's pages, the envelope's flap), a placed group that settles in as the shape completes (Skills), an optional per-group block size (the book's thin sheet, the headset's lenses) and an optional live role per group. Blocks a shape doesn't use tuck into its centre at scale 0. The hero cube must keep the poster's exact size and angle (`step: 0.667`). Every shape stays ≤ 100 voxels (`BUILD_BLOCKS`).
   - **Free boxes:** each home section (`main section[id]`, mapped in `SHAPE_BY_SECTION`) gets a box in the hero visual's column, right of its heading and intro and above its cards. The box starts below the previous section's content and ends above the section's `data-build-end` element (or the end of its content). Its left edge clears every `data-build-clear` text in that band. The shape is centred in the box and scaled to fit, with room for its live actions and sway; when there isn't room (fit < 0.36 of the hero cube), the section gets no stop. The hero's box is the hero visual plus 24px, so at scroll 0 the cube sits exactly on the poster, whose own cube then fades (its grid and glow stay).
   - **Clipped, page-anchored canvas:** one canvas, absolutely positioned in the document and behind all content (`-z-1`), so it scrolls with the page natively. Each drawn frame, its clipped box (`overflow: hidden`, `data-build-box`) is moved to the blocks' bounds and cut to the current stop's band (from its free box's left edge to the viewport's right edge, between the box's top and bottom). The box also covers the beam, which spans the free box (inside its padding). Never past `clientWidth`, so no horizontal scroll. Every point on the path is safe, so a frame that lags the scroll still can't draw over text or a card. **New content beside a heading needs `data-build-clear`; a section's first card block needs `data-build-end`.**
   - **Scroll mapping (scrubbed, reversible, unhurried):** positions are where a stop's centre sits in the viewport. From 98% to 55% the beam rises through the shape and prints it (each block grows in over ~1 block of beam travel, settling slightly and glowing where the beam touches it). The shape holds from 55% to 15%. From 15% to −2% the beam falls through it and dissolves it top down. The beam fades in and out over the ends of each sweep. The header mark switches 15% into a stop's print (`dockAt`). Between stops nothing shows. When sections sit close, a shape first leaves earlier (holding at least until 30%; the hero may leave as soon as you scroll), then the next forms later (formed by 35%), each keeping its full length; only if that isn't enough do the two share the scroll in proportion. The last shape (Contact) finishes forming by the bottom of the page and stays. Progress follows the scroll with ~200 ms damping (`build-scroll.ts`, `build-poses.ts`).
   - **Live actions** (`build-live.ts`; while a shape is formed and on screen, easing in over ~0.6 s and out as it leaves): stack, a request block steps UI → API → database and back; headset, a look-around sway while its lenses pulse softly (per-instance glow); aeroplane, a gentle bank and bob; book, a thin sheet turns over every ~4.5 s, then quietly rises back out of the right-hand pages; tiles, every ~3 s one inner tile lifts and settles back; person, waves every ~6 s with a slight breathing bob while its headset lenses pulse and its laptop screen stays lit; envelope, the flap lifts and a small letter peeks out over the top, then both settle. Every shape also sways slowly and slightly so it reads as 3D.
   - Rendering: every frame while scroll moves the companion along its path (rAF-throttled), on resize, the pointer over the hero, and while a move or ease is in progress; ~30 fps for the hero cube's turn and breathing and for the live actions, and only while the companion is on screen. Nothing otherwise. Stops while the tab is hidden; off with Motion off (unmounted).
2. **AR creature viewer** in the AR Elemental Arena card (`creature-viewer.tsx`, gate `creature-stage.tsx`, models `public/models/ar/*.glb`, Quaternius). It loads the first time the card scrolls into view, not on page load. The four creatures sit over their summon cards: drag to rotate, click or "Animate" to play the next clip, and Fire/Water/Earth/Air chips (each model loads when first chosen). Its controls sit inside the phone frame, so nothing shifts.

The structure must stay ready for a future `/xr` showcase (§4).

## 7. Quality bars (definition of done for every task)

- Lighthouse (mobile): **Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.**
- LCP < 2.5s, CLS < 0.1, INP < 200ms. Keep the initial JS small; the 3D bundle is lazy-loaded.
- Accessibility: semantic landmarks, one `h1`, a logical heading order, a skip link, visible focus styles, alt text on every meaningful image, keyboard-reachable everything, `aria-label` on icon-only links.
- Images via `next/image` (AVIF/WebP, explicit sizes). Fonts via `next/font`.
- `pnpm lint`, `pnpm typecheck` (`tsc --noEmit`) and `pnpm build` all pass with zero errors.
- Check the result at widths of 360px, 768px and 1280px.

## 8. Code conventions

- `src/app` (routes), `src/components/sections` (one file per home section), `src/components/ui` (buttons, cards, tags), `src/components/three` (3D only), `src/content` (typed data), `src/lib` (utils).
- Server Components by default; `"use client"` only where interaction or animation needs it.
- Small, readable components; no `any`; named exports for components.
- No inline magic colours. Use tokens or Tailwind theme values.
- Share images and icons are drawn from `src/lib/cube.ts`, with colours from `src/lib/brand.ts`. Keep `brand.ts` in sync with the dark tokens in `globals.css`. Set `NEXT_PUBLIC_SITE_URL` in every deploy environment.

## 9. How we work (workflow rules)

- **One section or feature per task.** Start in plan mode: show the plan (files to create/change, components, data shape, a11y and performance notes) and wait for approval.
- After building: run lint, typecheck and build, fix any issues, then summarise what changed and what I should check in the browser.
- **Do not commit until I say so.** Then use Conventional Commits (e.g. `feat(hero): add static hero with CTAs`).
- If a request conflicts with this file, say so before acting.
- Keep this file current: if we make a lasting decision, propose an edit to CLAUDE.md.
