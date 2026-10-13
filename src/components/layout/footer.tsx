import { cacheLife } from "next/cache";
import { shellCopy } from "@/content/navigation";
import { site } from "@/content/site";
import { Container } from "@/components/ui/container";
import { SocialLinks } from "@/components/ui/social-links";

const textLink = "inline-flex min-h-11 items-center transition-colors hover:text-text";

/** Cached so the page stays static: the year is fixed at build time, and every deploy rebuilds. */
async function buildYear() {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}

export async function Footer() {
  const year = await buildYear();
  const repo = site.links.portfolioRepo;

  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-4 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p>
            © {year} {site.name}
          </p>
          <p>
            {site.footer.builtWith} ·{" "}
            <a
              href={repo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition-colors hover:text-text"
            >
              {repo.label}
              <span className="sr-only"> {site.contact.opensNewTab}</span>
            </a>
          </p>
        </div>

        <div className="-ml-3 flex flex-wrap items-center gap-x-4 sm:ml-0">
          <SocialLinks variant="icon" />
          <a href="#top" className={textLink}>
            {shellCopy.backToTop}
          </a>
        </div>
      </Container>
    </footer>
  );
}
