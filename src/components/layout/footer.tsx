import { shellCopy } from "@/content/navigation";
import { site } from "@/content/site";
import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-2 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{site.name}</p>
        <a href="#top" className="inline-flex min-h-11 items-center transition-colors hover:text-text">
          {shellCopy.backToTop}
        </a>
      </Container>
    </footer>
  );
}
