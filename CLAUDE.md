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
- **Motion:** short (150–400ms), purposeful; reveal-on-scroll at most once per element. Nothing loops in the UI except the 3D elements (the PIPELINE caret blinks only while it types). Every effect follows the site motion switch and the Signature language (§5a).

## 5a. Signature language

The site's motion is drawn from Manditha's own projects. New motion must use one of these three motifs, or not exist.

- **ASSEMBLE** (from the hero cube, "systems from parts"): elements snap together from parts. Used by: section labels ("01 / Work") assembling character by character (`AssembleText`), and the hero cube's idle pulse (it separates and reassembles every few seconds after ~4 s without input; `parts-cube.tsx`).
- **SCAN** (from AR Elemental Arena): AR tracking corners, a single scan sweep, the ring reticle. Used by: a one-time scan sweep and hover/keyboard-focus tracking corners (`ScanFrame` + `ScanObserver`) on the home page's project, VR/AR and experience cards and on the case studies' challenge cards and gallery tiles; the hero's ring reticle over a dot "surface" (`HeroReticle`, desktop only); the creature viewer's lock-on, where corners grow in around the summon card on each summon and one sweep runs the first time (`.lock-corners` / `.lock-line`, separate from the card's own `.scan-*` so the card's hover and sweep never reach them).
- **PIPELINE** (from PPCH, Sense → Analyze → Act): small steps that check, then resolve. Used by: the hero status line (`PipelineStatus`) and count-up measured numbers (`CountUp`, values listed per item in `countUp` in the content files).

Global rules for every effect:
- No new dependencies (Motion, CSS and small client islands only).
- Off when site motion is off (one exception: SCAN tracking corners are a hover/focus state, not motion, so they still appear with motion off, static, with no lock-on). `data-motion="on" | "off"` on `<html>` is the single switch (`src/lib/motion-pref.ts`, hook in `src/lib/use-motion-on.ts`). It is set before first paint from the stored choice, else `prefers-reduced-motion`. An explicit click on the Motion toggle wins over the OS default and is saved in `localStorage` (try/catch). CSS uses the `motion-on:` variant, never `motion-safe:`.
- Nothing delays or hides the hero h1 or intro (LCP).
- Real text is always in the DOM for screen readers and SEO; animated copies are `aria-hidden` overlays that never change layout.
- One-shot effects play once per page load.
- Pause when off-screen or the tab is hidden.
- Desktop-only effects also need `(hover: hover)` and `(pointer: fine)`.
- The Motion toggle has a fixed accessible name ("Pause animations"), and `aria-pressed` carries the state.

## 6. 3D elements

3D is allowed only where it shows my real work. Every piece follows these rules:

- **Lazy and gated.** Load it with `next/dynamic` (`ssr: false`), and only when the gate passes: large screen with a fine hover pointer (`CAPABLE_QUERY`), site motion on, WebGL2 available and no Save-Data (helpers in `src/components/three/gate.tsx`). Phones, Motion off (`data-motion="off"`, which defaults from `prefers-reduced-motion`) and no WebGL never download the chunk or any model.
- **Poster first.** A server-rendered poster (SVG or a screenshot) renders first. It is the LCP-safe loading state and the fallback for any failure (chunk, WebGL, context loss, model fetch). The canvas overlays the poster at the same size, so there is no layout shift.
- **Cheap to run.** DPR capped at 1.5, `frameloop="demand"` (render only while something moves), paused when off-screen or the tab is hidden, and geometries, materials and textures disposed on unmount.
- **Small assets.** Procedural where possible. Any model must be < 500 KB, load only when needed and be cached after. Use `GLTFLoader` from `three/examples/jsm`; no drei and no new dependencies.
- **Decorative canvas.** `aria-hidden`, never traps focus or scroll, and the page is fully usable without it. Any interaction also has a keyboard path through real buttons.

The pieces:

1. **Hero parts cube** (`parts-cube.tsx`, gate `hero-visual.tsx`): procedural, loads when the browser is idle after first paint.
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
