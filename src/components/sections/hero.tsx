import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { BootGrowthGate } from "@/components/three/boot-growth-gate";
import { HeroPoster } from "@/components/three/hero-poster";
import { HeroVisual } from "@/components/three/hero-visual";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { IconLink } from "@/components/ui/icon-link";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { BootBlock } from "@/components/ui/boot-block";
import { BootStatus } from "@/components/ui/boot-status";
import { StatusPill } from "@/components/ui/status-pill";
import { bootMeasureScript } from "@/lib/boot";
import { GROWTH_COUNTS, GROWTH_TOTAL } from "@/lib/boot-growth";

/** Place in the cube boot's reveal order (globals.css, "Cube boot"): one reveal step apart. */
const order = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * The cube boot's part counter, under the cube while it grows: each count shows from its step until the
 * next (globals.css, .boot-count); the last ("27 / 27 · ready") stays as it travels to the pill.
 */
function BootCounter({ counting, ready }: { counting: string; ready: string }) {
  return (
    <span data-boot-caption="" className="boot-count">
      {GROWTH_COUNTS.map(({ at, count }, i) => {
        const next = GROWTH_COUNTS[i + 1];
        const label = next ? `${counting} ${count} / ${GROWTH_TOTAL}` : `${count} / ${GROWTH_TOTAL} · ${ready}`;
        const shown = { "--at": `${Math.round(at)}ms`, "--for": `${Math.round((next?.at ?? at + 1) - at)}ms` };
        return (
          <span key={count} style={shown as CSSProperties}>
            {label}
          </span>
        );
      })}
    </span>
  );
}

export function Hero() {
  const { hero, links } = site;
  // Each word of the name sits in its own clip wrapper, so it can slide up into place in the boot.
  // Inline blocks, so the name still wraps where it did; the h1's text is unchanged.
  const nameWords = site.name.split(" ");

  return (
    <section id="top" aria-labelledby="top-heading" className="hero-section relative isolate pt-8 pb-section lg:pt-16">
      <Container className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div>
          <StatusPill className="boot-pill">
            <BootStatus status={hero.statusPill} caption={<BootCounter {...hero.assembly} />} />
            <BootBlock target="dot" />
          </StatusPill>
          <h1 id="top-heading" className="boot-name mt-5 text-display font-semibold tracking-tight">
            {nameWords.map((word, i) => (
              <span key={word}>
                {i > 0 && " "}
                <span className="boot-line inline-block" style={order(i)}>
                  <span className="inline-block">{word}</span>
                </span>
              </span>
            ))}
          </h1>
          <p className="boot-rise mt-3 text-lg text-text-muted sm:text-xl" style={{ ...order(1), "--rise": "8px" } as CSSProperties}>
            {site.headline}
          </p>
          <p className="boot-rise mt-5 max-w-prose sm:text-lg" style={{ ...order(2), "--rise": "12px" } as CSSProperties}>
            {hero.intro}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {/* In the boot a block from the cube lands here and expands into the button, which then fills. */}
            <span className="relative inline-flex">
              <ButtonLink href="#work" className="boot-cta">
                {hero.ctas.viewWork}
              </ButtonLink>
              <BootBlock target="cta" />
            </span>
            <ButtonLink
              href={site.cvHref}
              download
              variant="secondary"
              className="boot-rise"
              style={{ ...order(3), "--rise": "12px" } as CSSProperties}
            >
              {hero.ctas.downloadCv}
            </ButtonLink>
          </div>

          <div className="boot-socials mt-4 -ml-3 flex gap-1">
            <IconLink href={links.github.href} label={hero.ctas.github}>
              <GitHubIcon />
            </IconLink>
            <IconLink href={links.linkedin.href} label={hero.ctas.linkedin}>
              <LinkedInIcon />
            </IconLink>
          </div>
        </div>

        {/* Fixed aspect ratio: the poster renders first and the 3D canvas (desktop only) overlays it, so nothing shifts. */}
        <div
          aria-hidden="true"
          className="relative mx-auto aspect-square w-full max-w-xs sm:max-w-sm lg:max-w-none"
        >
          <HeroVisual>
            {/* Light theme only: a soft halo behind the cube, under the poster and the 3D canvas (globals.css). */}
            <div className="hero-halo hero-glow pointer-events-none absolute inset-0 -z-1" />
            <HeroPoster />
          </HeroVisual>
          <BootGrowthGate />
        </div>
      </Container>
      {/* The cube boot's FLIP "first" positions, measured before first paint (only while it plays). */}
      <script dangerouslySetInnerHTML={{ __html: bootMeasureScript }} />
    </section>
  );
}
