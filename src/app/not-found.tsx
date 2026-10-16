import type { Metadata } from "next";
import { site } from "@/content/site";
import { HeroPoster } from "@/components/three/hero-poster";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

const copy = site.notFound;

// Next adds noindex to 404 responses itself.
export const metadata: Metadata = {
  title: copy.title,
};

export default function NotFound() {
  return (
    <section aria-labelledby="not-found-heading" className="py-section lg:py-24">
      <Container className="grid items-center gap-10 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="font-mono text-sm text-accent">{copy.label}</p>
          <h1 id="not-found-heading" className="mt-3 text-display font-semibold tracking-tight">
            {copy.heading}
          </h1>
          <p className="mt-4 max-w-prose text-lg text-text-muted">{copy.line}</p>
          <div className="mt-7">
            <ButtonLink href="/">{copy.cta}</ButtonLink>
          </div>
        </div>

        <div aria-hidden="true" className="mx-auto aspect-square w-full max-w-56 sm:max-w-xs">
          <HeroPoster />
        </div>
      </Container>
    </section>
  );
}
