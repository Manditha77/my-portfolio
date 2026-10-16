# Manditha Madushanka: portfolio

My personal portfolio: software engineering work, my aeroPORT internship, and VR/AR side projects.

**Live:** https://manditha.vercel.app

## Stack

- Next.js 16 (App Router, statically generated) and React 19
- TypeScript (strict)
- Tailwind CSS 4, with design tokens as CSS variables
- Motion for UI animation
- React Three Fiber and three.js for the single 3D element in the hero
- Deployed on Vercel; pnpm as the package manager

## Project structure

```
src/
  app/                  routes: home, /work/* case studies, 404, share images, sitemap, robots
  components/
    sections/           one file per home-page section
    ui/                 buttons, cards, badges, tags
    layout/             header, footer, skip link, theme script
    three/              the 3D element and its static poster (nothing else)
  content/              typed data files: every piece of copy on the site
  lib/                  small utilities (theme, SEO, JSON-LD, site URL)
docs/
  CONTENT.md            the single source of truth for all facts
CLAUDE.md               the design brief and working rules
```

## Key engineering decisions

**Content as data.** Every fact on the site comes from `docs/CONTENT.md` and lives in typed files under `src/content/`. Components never hard-code copy, so changing a project or a date is a data edit, and TypeScript catches missing fields.

**Lazy 3D with a poster fallback.** The hero always server-renders a static poster first, so the 3D scene never affects LCP or layout shift. The React Three Fiber chunk is requested only when all of these are true:

- the screen is at least 1024px wide and has a fine, hover-capable pointer
- the user has not asked for reduced motion
- Save-Data is off and WebGL2 is available
- the page has loaded and the browser is idle

Phones and reduced-motion users never download it. The scene pauses when it is off-screen or the tab is hidden, and any loading or WebGL error leaves the poster in place. The canvas is decorative (`aria-hidden`).

**Accessibility.** Semantic landmarks, a skip link, one `h1` with a logical heading order, visible focus styles, full keyboard support, `aria-label` on icon-only links, WCAG AA contrast in both the dark and light themes, and `prefers-reduced-motion` respected throughout. The theme follows the system setting, with a manual toggle.

**SEO.** Per-page metadata, generated Open Graph and Twitter images, a sitemap, `robots.txt`, JSON-LD (`Person`), and verification in Google Search Console.

## Lighthouse (mobile, Oct 2026)

| Performance | Accessibility | Best Practices | SEO |
| :-: | :-: | :-: | :-: |
| 99 | 100 | 100 | 100 |

## Run locally

Requires Node.js and pnpm.

```bash
pnpm install
cp .env.example .env.local   # sets NEXT_PUBLIC_SITE_URL=http://localhost:3000
pnpm dev                     # http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` is the site's public origin, used for canonical URLs, the sitemap and share images. Set it in every deploy environment.

Checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## How it was built

I built this site with [Claude Code](https://claude.com/claude-code) as an AI pair programmer. [`CLAUDE.md`](CLAUDE.md) is the written design brief: audience, priorities, content rules, stack, design direction and quality bars. Each section went through the same loop, one section at a time: plan → build → verify (lint, typecheck, build, browser checks at 360, 768 and 1280px) → commit. Facts come only from `docs/CONTENT.md`, and gaps were left as visible `TODO`s rather than filled in.

## Credits

Team and third-party asset credits for the VR/AR projects are on their case study pages ([ElectricalSafetyVR](https://manditha.vercel.app/work/electrical-safety-vr), [AR Elemental Arena](https://manditha.vercel.app/work/ar-elemental-arena)). The written content and images are my own or credited there, and are not licensed for reuse.
