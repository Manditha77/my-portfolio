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
Build the Hero section using src/content/site.ts (use its existing fields: name, headline,
hero intro, status pill, CTA labels, cvHref, GitHub/LinkedIn links).
- h1 name, tagline, intro, an "Open to Associate SE roles" status pill
- CTAs: "View my work" → #work (primary), "Download CV" → cvHref with the download attribute (secondary)
- GitHub and LinkedIn icon links with aria-labels
- Two columns on desktop (text left, visual right); stacked on mobile (text first)
- Reserve the visual area for the Step 4 3D element: for now a static, decorative, aria-hidden
  poster (simple SVG built from our tokens, fixed aspect ratio so nothing shifts later)
- The hero text is the LCP element and renders as a Server Component with no client JS
- A subtle entrance animation is allowed only if it doesn't delay or hide the h1, and is off under prefers-reduced-motion
- The hero should fill most of the first screen on desktop without pushing the CTAs below the fold on a 360×640 phone
Plan first.
```

### Step 4: The 3D element
```
Replace the hero poster area with the one 3D element, following CLAUDE.md section 6 exactly.
Propose 2–3 concepts first, with an estimated added JS size for each, and wait for me to pick.
Include this concept as one option: "Systems from parts": a cube made of smaller blocks
(instancedMesh, one draw call, no textures) that slowly rotates and, on pointer move/hover,
gently separates into its modules and then reassembles. It should match the existing hero poster.

When to load 3D (otherwise the existing poster stays):
- only at the lg breakpoint and up AND with (hover: hover) and (pointer: fine)
- WebGL is available, prefers-reduced-motion is not "reduce", and Save-Data is not on
- loaded with next/dynamic (ssr:false) after the browser is idle; phones never download the 3D chunk

Requirements: add three and @react-three/fiber (drei only if truly needed; justify it);
the poster stays as the fallback and loading state, with an identical size and aspect ratio (no layout shift);
the canvas fades in over the poster once ready; DPR capped at 1.5; pause rendering when off-screen or the tab
is hidden; aria-hidden; no pointer/scroll trapping.
After building, report the lazily loaded 3D chunk size, and confirm first-load JS for / did not grow meaningfully
and that a 360px mobile emulation does not request the 3D chunk (check the DevTools Network tab).
Plan first.
```

### Step 5: Selected Work (SE projects)
```
Build the Selected Work section (#work) from src/content/projects.ts.
- 3 project cards: title, year and type badge, blurb, highlights, tech tags (mono), and links (GitHub repo).
- PPCH shows a "Completed" badge (normal style); the Employee Management System card shows "Team project" plus a "My role: …" line.
- Screenshots: if images exist in public/images/projects/<slug>/, show the first one with next/image (explicit sizes,
  lazy-loaded, meaningful alt text). If none exist, show no image area at all for that card (no fake screenshots or
  stock images) and list which ones are missing at the end.
- Layout: 1 column on mobile; on desktop, either a 3-column grid or GroceryEase as a wider featured card with the
  other two beside or below it. Propose which and why.
- Section heading and a one-line intro, plus a "More on GitHub" link at the end.
- Whole cards should not be clickable blobs: use real links with clear text and visible focus styles.
- Server Components only; hover effects with CSS only.
Plan first.
```

### Step 6: XR Spotlight + case study page
```
Build Step 6 (XR) using docs/XR-CONTENT.md as the source of truth.

1. Content:
   - Replace the XR section in docs/CONTENT.md with the contents of docs/XR-CONTENT.md, then delete docs/XR-CONTENT.md.
   - Update src/content/xr.ts to match exactly: strict types; images with alt text and real width/height
     read from the files in public/images/projects/electrical-safety-vr/; team list; challenges; youtubeId optional
     and currently empty.

2. Turn the XR feature flag on (site.ts features.xr = true) so the section and the "XR" nav link return.

3. Home #vr-ar Spotlight, with the "mode shift" styling from CLAUDE.md §5 (faint grid/scanline background, accent glow):
   - title, blurb, stack tags (accent tone), overview.png as the visual
   - buttons: "Read the case study" (→ /work/electrical-safety-vr) and "View code on GitHub"

4. /work/electrical-safety-vr page:
   - hero: title, context line (including "Team of 5"), stack tags, repo link
   - video block: if youtubeId exists, a YouTube facade (youtube-nocookie, click to load, no third-party JS
     before the click); if not, show overview.png with a small "Demo video coming soon" label and no play button
   - sections in this order: The problem, What trainees do (numbered), My role, Technical challenges
     (3 cards), Outcome, Credits
   - Team presentation: don't make Team a separate section. Put the team as one compact line at the start
     of Credits, e.g. "Built with Dulmi (interactions), Sanduni (hazards), Dinan (game flow) and Ridmi
     (workshop scene)." Then the asset credits, with a link to the repo's CREDITS.md.
     "My role" and "Technical challenges" stay the main, most prominent sections.
   - a simple gallery of the 5 screenshots (next/image, lazy-loaded, captions from the alt text)
   - "← Back to home" at the top, and a link to the next home section (#experience) at the bottom
   - page metadata: title, description from the blurb, Open Graph image = overview.png

5. Server Components only (except the video facade, if it needs client JS); reuse existing components
   (Section, TagList, Badge, ButtonLink, Reveal) and tokens; no new dependencies unless you justify them.

Check at 360, 768 and 1280px in both themes. Plan first.
```

### Step 7: Experience + Writing
```
Build the Experience section (#experience) and a Writing strip after it, from src/content/experience.ts and writing.ts.
Experience:
- The aeroPORT internship is the prominent first entry: role, company, dates, location, a one-line product
  description (aeroPORT DCS used by Air Arabia), the bullets, and tech tags (reuse the Tag component).
- Then a compact "Leadership & activities" list (role, event/organisation, year) and an "Education" entry.
- Use semantic markup (article/ol, time elements for dates). No logos or images.
Writing:
- A small strip titled "Writing" with the 2 Medium articles: title, month/year, one-line summary,
  external link with rel="noopener noreferrer" and a visible "↗" plus "(opens Medium)" for screen readers.
- Keep the Medium URLs as they are in writing.ts; they are still TODO-verified, so list them for me at the end.
Reuse existing components and tokens; Server Components only; no new dependencies.
Check at 360, 768 and 1280px in both themes.
Plan first.
```

### Step 8: Skills + About
```
Build the Skills section (#skills) and the About section (#about) from src/content/skills.ts and about.ts.
Skills:
- Grouped tag lists (reuse TagList), one group per row with the group name as a small label. No bars, no percentages, no icons.
- TypeScript and C# stay in the Languages group; remove any asterisk or footnote about them in skills.ts and docs/CONTENT.md.
- Tags in the XR group use the accent style, as a quiet link to the XR section.
- Two columns of groups on desktop, one on mobile.
About:
- The 4 paragraphs from about.ts, comfortable reading width (~65ch).
- If public/images/manditha.jpg exists: a rounded photo beside the text on desktop and above it on mobile,
  via next/image with alt text "Manditha Madushanka". If it doesn't exist, no image area at all.
- End with two text links: "Download CV" and "Get in touch" (→ #contact).
Server Components only, no new dependencies. Check at 360, 768 and 1280px in both themes.
Plan first.
```

### Step 9: Contact + footer
```
Build the Contact section (#contact) and finish the footer, from src/content/site.ts.
Contact:
- Heading and line from site.ts, then a primary "Email me" button (mailto:) and a secondary "Copy email" button.
- Copy email: navigator.clipboard with a fallback; shows "Copied!" for ~2s and announces it via an aria-live
  region; if copying fails, show the address as selectable text. This button is the only client component.
- Below: LinkedIn, GitHub and Medium as text-and-icon links (new tab, rel="noopener noreferrer", "(opens in new tab)" for screen readers).
- Display the email address as plain text too, so it can be read and copied by hand.
- No form, no backend, no phone number, no address.
Footer:
- © current year + name, the same three social links (icon-only with aria-labels), "Back to top",
  and "Built with Next.js · Source on GitHub" linking to the portfolio repo (put the repo URL in site.ts; ask me for it).
Server Components except the copy button; no new dependencies. Check at 360, 768 and 1280px in both themes.
Plan first.
```

### Step 10: Motion polish pass
```
Polish pass on the home page, in two parts. Plan first.
1. Spacing: the vertical gap between sections is too large (about a full screen between some sections on desktop).
   Propose one consistent section spacing scale (e.g. ~96–128px between sections on desktop, ~64–80px on mobile),
   applied through the Section component, not per section. Show before/after values.
2. Motion with motion/react:
   - reveal-on-scroll once per section (short fade + small rise, 300–400ms, ease-out); never on the hero h1 or hero text
   - subtle hover/focus transitions on buttons, links and cards (CSS where possible)
   - smooth anchor scrolling
   - everything disabled under prefers-reduced-motion
   Keep client JS minimal: one small reusable Reveal wrapper, sections stay Server Components.
   Report the first-load JS change for /.
**After deploying Step 11:**
- Vercel → Project → Settings → Environments → Production → Environment Variables:
  `NEXT_PUBLIC_SITE_URL` = `https://manditha.vercel.app` (type Config; Production + Preview).
- Check `/sitemap.xml` and `/robots.txt` on the live site use the real URL.
- Google Search Console: URL-prefix property `https://manditha.vercel.app/`, verified with the HTML file
  `public/google83ae2c7b0390bd5a.html` (keep this file permanently); sitemap `sitemap.xml` submitted (Success, 2 pages).
- LinkedIn Post Inspector (linkedin.com/post-inspector) to check the share preview.
```


### Step 12: Performance and accessibility audit
```
**1. Measure the live site first (PageSpeed Insights, pagespeed.web.dev)**
Run Mobile and Desktop for both pages:
- `https://manditha.vercel.app`
- `https://manditha.vercel.app/work/electrical-safety-vr`

Targets (CLAUDE.md §7): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 on mobile.
Treat the "Insights" and "Diagnostics" items as suggestions; don't chase small savings once the scores pass.

Results (16 Oct 2026):
| Page | Mobile | Desktop |
|---|---|---|
| Home | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| Case study | 97 / 100 / 100 / 100 (LCP 2.6 s) | — |

**2. Validate structured data**
validator.schema.org → `https://manditha.vercel.app` → expect one Person item with 0 errors and 0 warnings. ✅

**3. Audit what automated tools miss (Claude Code, plan mode)**
```
Final audit for what automated tools miss. PageSpeed Insights (live) already scores mobile 99/100/100/100
and desktop 100/100/100/100 on the home page, so don't chase its minor insights. Plan first, list issues
by severity, fix only after I approve.
1. Colour contrast in the DARK theme (PageSpeed only tested light): check every text/background pair,
   including muted text, tags, badges, the accent-toned VR/AR tags and the "Demo video coming soon" label.
   List anything below WCAG AA.
2. Keyboard: full Tab pass on / and /work/electrical-safety-vr (skip link → nav → mobile menu → every link and
   button → footer). Focus always visible, logical order, nothing unreachable, Esc closes the menu.
3. Reduced motion: no reveal animations, no smooth scrolling, no 3D, nothing hidden.
4. Case study page: the hero image is the LCP image (priority), gallery images lazy, correct sizes, no CLS.
5. 320px: no horizontal scroll on either page.
```
Outcome: dark-theme contrast passes AA; reduced motion already correct; fixed the case-study title overflow
at 320px, prioritised the case-study hero image for LCP, and fixed mobile-menu and theme-toggle focus handling.

**4. Manual keyboard check (in a real browser, `pnpm dev`)**
- Tab from the address bar: "Skip to content" appears first and works.
- Tab through the whole page: a visible focus ring the whole way, nothing skipped, order is logical.
- At 360px: open the menu with Enter, Tab through it, Esc closes it and focus returns to the menu button.
- Repeat on /work/electrical-safety-vr.

**5. Commit, push, and re-run PageSpeed on the case study** to confirm LCP is at or under ~2.5 s.
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
