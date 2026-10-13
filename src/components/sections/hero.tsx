import { site } from "@/content/site";
import { HeroPoster } from "@/components/three/hero-poster";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { IconLink } from "@/components/ui/icon-link";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

export function Hero() {
  const { hero, links } = site;

  return (
    <section id="top" aria-labelledby="top-heading" className="pt-8 pb-12 lg:py-16">
      <Container className="grid items-center gap-10 lg:min-h-[calc(100svh-var(--header-h)-8rem)] lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div>
          <StatusPill>{hero.statusPill}</StatusPill>
          <h1 id="top-heading" className="mt-5 text-display font-semibold tracking-tight">
            {site.name}
          </h1>
          <p className="mt-3 text-lg text-text-muted sm:text-xl">{site.headline}</p>
          <p className="mt-5 max-w-prose sm:text-lg">{hero.intro}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="#work">{hero.ctas.viewWork}</ButtonLink>
            <ButtonLink href={site.cvHref} download variant="secondary">
              {hero.ctas.downloadCv}
            </ButtonLink>
          </div>

          <div className="mt-4 -ml-3 flex gap-1">
            <IconLink href={links.github.href} label={hero.ctas.github}>
              <GitHubIcon />
            </IconLink>
            <IconLink href={links.linkedin.href} label={hero.ctas.linkedin}>
              <LinkedInIcon />
            </IconLink>
          </div>
        </div>

        {/* Reserved slot for the Step 4 3D element: fixed aspect ratio so swapping it in never shifts layout. */}
        <div
          aria-hidden="true"
          className="relative mx-auto aspect-square w-full max-w-xs motion-safe:animate-hero-in sm:max-w-sm lg:max-w-none"
        >
          <HeroPoster />
        </div>
      </Container>
    </section>
  );
}
