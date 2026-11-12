import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { HeroPoster } from "@/components/three/hero-poster";
import { HeroVisual } from "@/components/three/hero-visual";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { IconLink } from "@/components/ui/icon-link";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { PipelineStatus } from "@/components/ui/pipeline-status";
import { StatusPill } from "@/components/ui/status-pill";
import { bootMeasureScript } from "@/lib/boot";

/** Place in the cube boot's reveal order (globals.css, "Cube boot"): one reveal step apart. */
const order = (i: number) => ({ "--i": i }) as CSSProperties;

export function Hero() {
  const { hero, links } = site;
  // Each word of the name sits in its own clip wrapper, so it can slide up into place in the boot.
  // Inline blocks, so the name still wraps where it did; the h1's text is unchanged.
  const nameWords = site.name.split(" ");

  return (
    <section id="top" aria-labelledby="top-heading" className="relative isolate pt-8 pb-section lg:pt-16">
      <Container className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div>
          <StatusPill className="boot-pill">
            <PipelineStatus status={hero.statusPill} steps={hero.pipeline} />
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

          <div className="boot-rise mt-7 flex flex-wrap gap-3" style={{ ...order(3), "--rise": "12px" } as CSSProperties}>
            <ButtonLink href="#work" className="boot-fill">
              {hero.ctas.viewWork}
            </ButtonLink>
            <ButtonLink href={site.cvHref} download variant="secondary">
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
            <HeroPoster />
          </HeroVisual>
        </div>
      </Container>
      {/* The cube boot's FLIP "first" positions, measured before first paint (only while it plays). */}
      <script dangerouslySetInnerHTML={{ __html: bootMeasureScript }} />
    </section>
  );
}
