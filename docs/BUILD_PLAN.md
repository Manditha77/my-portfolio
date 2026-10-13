# BUILD_PLAN.md: Step-by-step build with Claude Code

## Part A: One-time setup (about 20 minutes)

1. **Install tools:** Node.js LTS, pnpm (`npm i -g pnpm`), Git, VS Code, and the Claude Code extension (or the CLI: run `claude` in the VS Code terminal).
2. **Create the project yourself** (faster and more predictable than asking Claude). Run this in the folder that will hold your projects:
   ```bash
   pnpm create next-app@latest manditha-portfolio --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
   cd manditha-portfolio
   git init && git add -A && git commit -m "chore: scaffold Next.js app"
   ```
3. **Add the starter kit:**
   - `CLAUDE.md` → the project root (Claude Code loads it automatically every session)
   - `CONTENT.md` → `docs/CONTENT.md`
   - `BUILD_PLAN.md` → `docs/BUILD_PLAN.md`
   - `check.md` → `.claude/commands/check.md` (gives you a `/check` command)
   - Your CV PDF → `public/Manditha-Madushanka-CV.pdf`
   - Screenshots → `public/images/projects/<project-slug>/` (e.g. `groceryease/dashboard.png`)
   - Commit: `git add -A && git commit -m "docs: add design brief, content and plan"`
4. **Create a GitHub repo** (e.g. `Manditha77/portfolio`) and push. Vercel will deploy from it later.
5. **Fill the TODOs in `docs/CONTENT.md`** as you go. Claude Code is told to stop at any TODO rather than invent content.

## Part B: The loop for every step

1. Press **Shift+Tab** until the mode shows **plan mode**.
2. Paste the step's prompt.
3. Read the plan. Push back if it adds unasked-for dependencies, invents content or ignores CLAUDE.md. Then approve.
4. Check it at `pnpm dev` → http://localhost:3000, at mobile (DevTools device mode, 360px) and desktop widths.
5. Run **`/check`**, which lints, typechecks, builds and suggests a commit message.
6. Commit, then **`/clear`** before the next step, so each step starts with a fresh context (CLAUDE.md reloads automatically).

**Tips that make Claude Code far more effective:**
- Paste screenshots straight into the prompt when something looks off. "This spacing, here" beats a paragraph of description.
- Be specific with feedback: "the cards feel cramped on mobile; increase gap to 24px and make tags wrap" beats "make it better".
- If it goes off track, press **Esc** to stop it. Use `git restore .` or `git checkout .` to undo uncommitted changes, which is why you commit after every step.
- When you make a lasting decision ("we use Geist, not Inter"), ask Claude to add it to CLAUDE.md.
- Keep each step to one section. Long multi-section prompts produce worse results.

## Part C: Steps and prompts

### Step 1: Foundations (tokens, fonts, theme, layout shell)
```
Set up the foundations described in CLAUDE.md sections 3, 5 and 8:
- folder structure (src/components/{sections,ui,three}, src/content, src/lib)
- design tokens as CSS variables for dark (default) and light themes, wired into Tailwind
- fonts via next/font (one sans, one mono)
- a theme toggle (prefers-color-scheme default, manual override in localStorage with try/catch, no flash on load)
- root layout with a skip link, a sticky header (name/logo, anchor nav: Work, XR, Experience, About, Contact, plus a CV button) with a mobile menu, and a simple footer
- empty, labelled <section> placeholders for every home section, in CLAUDE.md order
- add "typecheck": "tsc --noEmit" to package.json scripts
No real content yet. Plan first.
```

### Step 2: Content layer
```
Read docs/CONTENT.md and complete the content layer in src/content/.
site.ts and navigation.ts already exist from Step 1: extend them, don't replace or duplicate them,
and keep everything that currently imports them working.
Create the remaining files: projects.ts, xr.ts, experience.ts, writing.ts, skills.ts, about.ts.
Define strict TypeScript types for each (no any; optional fields for things like screenshots and the video ID).
Copy the text exactly from CONTENT.md; do not rewrite or embellish.
Keep TODO items as visible TODO strings and list them for me at the end.
Plan first.
```

### Step 3: Hero (static)
```
Build the Hero section using src/content/site.ts: h1 name, tagline, intro, an
"Open to Associate SE roles" status pill, CTAs (View my work → #work, Download CV → /Manditha-Madushanka-CV.pdf with the download attribute),
and GitHub/LinkedIn icon links with aria-labels.
Reserve a right-hand (desktop) / below-text (mobile) area for the future 3D element,
using a static decorative poster for now. The hero text must be the LCP element and render
without any client JS. Subtle entrance animation that is disabled under prefers-reduced-motion.
Plan first.
```

### Step 4: The 3D element
```
Replace the hero poster area with the one 3D element, following CLAUDE.md section 6 exactly.
Propose 2–3 concepts first (procedural, lightweight, pointer-reactive, fits "software engineer
who also builds XR"), with an estimated bundle size for each, and wait for me to pick one.
Requirements: next/dynamic with ssr:false, loaded after idle; static poster fallback (no WebGL,
reduced motion, or still loading); DPR capped at 1.5; pauses when off-screen; aria-hidden;
no layout shift. Report the added JS size after building.
```

### Step 5: Selected Work (SE projects)
```
Build the Selected Work section (#work) from src/content/projects.ts: 3 project cards with
title, year/type badge, blurb, highlights, tech tags (mono font), and links (GitHub, and a
screenshot if present in public/images/projects/<slug>/). Show the "In progress" status on PPCH
and "Team project · my role: …" on the Employee Management System card.
Responsive grid (1 column on mobile, 3 on desktop). End with a "More on GitHub" link. next/image for screenshots.
Plan first.
```

### Step 6: XR Spotlight + case study page
```
Build two things from src/content/xr.ts:
1) The home #xr Spotlight section with the "mode shift" styling from CLAUDE.md section 5: title,
   blurb, my-role line, stack tags, a YouTube facade (youtube-nocookie, click to load), and buttons
   for "Read the case study" (→ /work/electrical-safety-vr) and the repo.
2) The /work/electrical-safety-vr page: problem, my role, features, technical challenges, video,
   outcome, team credits, asset credits (link to the repo's CREDITS.md), and repo link. Include
   per-page metadata. If any content is still TODO, render a clear placeholder and tell me.
Plan first.
```

### Step 7: Experience + Writing
```
Build the Experience section (#experience) from src/content/experience.ts, with the aeroPORT
internship as the prominent first entry (role, company, dates, product line, bullets, tech tags),
then a compact list of Leadership & Activities and Education. After it, a small Writing strip with
the 2 Medium articles from src/content/writing.ts (external links, rel="noopener").
Plan first.
```

### Step 8: Skills + About
```
Build the Skills section (#skills) as grouped tag lists from src/content/skills.ts (no bars, no
percentages), and the About section (#about) from src/content/about.ts with an optional photo slot
(public/images/manditha.jpg if it exists; otherwise no image).
Plan first.
```

### Step 9: Contact + footer
```
Build the Contact section (#contact) from src/content/site.ts: heading, line, an email button
(mailto) plus a "copy email" button with accessible feedback, and LinkedIn/GitHub/Medium links.
No contact form or backend for now. Update the footer with © year, links, and "Built with
Next.js · source on GitHub". Plan first.
```

### Step 10: Motion polish pass
```
Review the whole home page and propose a light, consistent motion system using motion/react:
reveal-on-scroll once per section, hover states on cards and buttons, and smooth anchor scrolling.
Everything must respect prefers-reduced-motion. Show the plan with durations and easings; don't
add motion to the text in the hero LCP element.
```

### Step 11: SEO and sharing
```
Add SEO per CLAUDE.md: metadata (title template, description, canonical) via the Metadata API,
Open Graph and Twitter cards with a generated OG image (app/opengraph-image.tsx) for home and the case
study, app/sitemap.ts, app/robots.ts, JSON-LD Person schema (name, jobTitle, alumniOf, sameAs:
GitHub/LinkedIn/Medium), a favicon/app icon, and a not-found page. Use an env var
NEXT_PUBLIC_SITE_URL for absolute URLs. Plan first.
```

### Step 12: Performance and accessibility audit
```
Audit the site against CLAUDE.md section 7. Run `pnpm build` and report route sizes and first-load JS.
Check: one h1, heading order, alt text, focus styles, keyboard nav through the whole page, colour
contrast in both themes, reduced-motion behaviour, no horizontal scroll at 320px, CLS sources,
and image sizes. List issues by severity, then fix them after I approve.
```
Then run Lighthouse yourself: Chrome DevTools → Lighthouse → Mobile, on the **production** build (`pnpm build && pnpm start`). Paste the report summary back into Claude Code if anything is under target.

### Step 13: Deploy
Do this yourself, since it's quick:
1. Go to vercel.com and sign in with GitHub → **Add New Project** → import the portfolio repo → Deploy.
2. Add the env var `NEXT_PUBLIC_SITE_URL` = your Vercel URL (later, your domain) → redeploy.
3. **Custom domain (later):** buy one (e.g. `manditha.dev` or `mandithamadushanka.com`). In Vercel, go to Project → Settings → Domains, add it, and set the DNS records it shows. Update `NEXT_PUBLIC_SITE_URL`.
4. Add the site to **Google Search Console**, submit `/sitemap.xml`, and run Lighthouse on the live URL.
5. Put the URL on your CV, GitHub profile, LinkedIn (Featured + contact info) and the README of each featured repo.

## Part D: Before you share the link
- [ ] Every TODO in docs/CONTENT.md is resolved (search the codebase for "TODO")
- [ ] The CV PDF is the latest version, downloads correctly, and matches the site (XR + dissertation added to the CV)
- [ ] ElectricalSafetyVR: README added to the repo, team credited, video plays on mobile
- [ ] GroceryEase repo has a proper README with screenshots
- [ ] All links work (GitHub, LinkedIn, Medium, repos, CV)
- [ ] Lighthouse mobile ≥ 90 / 95 / 95 / 95 on the live URL
- [ ] Tested on a real phone (Android and, if possible, iPhone), plus keyboard-only and reduced-motion
- [ ] OG preview looks right (paste the link into LinkedIn or WhatsApp)
- [ ] No phone number or street address anywhere on the site
- [ ] Spelling and grammar pass on every section
