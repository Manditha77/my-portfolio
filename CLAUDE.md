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
2. **Selected Work (SE)**: 3 project cards (GroceryEase, Employee Management System, PPCH Framework).
3. **VR / AR Projects** (nav "VR/AR", anchor `#xr`): ElectricalSafetyVR summary with the video, linking to the full case study.
4. **Experience**: the aeroPORT internship (prominent) and leadership roles.
5. **Writing**: 2 Medium articles (small strip).
6. **Skills**: grouped, not progress bars, no percentages.
7. **About**
8. **Contact** + footer.

Additional routes:
- `/work/electrical-safety-vr`: the full case study (problem, my role, features, technical challenges, video, team credit, asset credits, repo link).
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
- **Motion:** short (150–400ms), purposeful; reveal-on-scroll at most once per element. Nothing loops in the UI except the 3D element.

## 6. The 3D element (one only)

- Lives in the hero. Lightweight and **procedural**: geometry built in code (e.g. an abstract wireframe/solid form or low-poly object that reacts to the pointer). No heavy GLB models; any model must be < 500 KB (Draco/meshopt compressed).
- Loaded with `next/dynamic` (`ssr: false`) **after first paint / when idle**. A static poster (SVG/AVIF) renders first and is the LCP-safe fallback.
- **`prefers-reduced-motion: reduce` → no animation;** show the static poster, or a frozen frame.
- Low-power / small screens: cap DPR at 1.5, use `frameloop="demand"` or pause when off-screen (IntersectionObserver), and drop to the poster when WebGL is unavailable.
- The canvas is decorative: `aria-hidden`, never traps focus or scroll, and the page is fully usable without it.

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

## 9. How we work (workflow rules)

- **One section or feature per task.** Start in plan mode: show the plan (files to create/change, components, data shape, a11y and performance notes) and wait for approval.
- After building: run lint, typecheck and build, fix any issues, then summarise what changed and what I should check in the browser.
- **Do not commit until I say so.** Then use Conventional Commits (e.g. `feat(hero): add static hero with CTAs`).
- If a request conflicts with this file, say so before acting.
- Keep this file current: if we make a lasting decision, propose an edit to CLAUDE.md.
