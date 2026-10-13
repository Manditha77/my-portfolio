import { site } from "@/content/site";
import { Container } from "@/components/ui/container";

export function Hero() {
  return (
    <section id="top" aria-labelledby="top-heading" className="py-20 sm:py-32">
      <Container>
        <h1 id="top-heading" className="text-display font-semibold tracking-tight">
          {site.name}
        </h1>
        <p className="mt-4 text-lg text-text-muted">{site.role}</p>
        {/* Placeholder: built in Step 3 (docs/BUILD_PLAN.md). */}
        <p className="mt-4 font-mono text-sm text-text-muted">TODO: Step 3</p>
      </Container>
    </section>
  );
}
