import Link from "next/link";
import { primaryNav, shellCopy } from "@/content/navigation";
import { site } from "@/content/site";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  return (
    // Fixed height (border included) so it always matches --header-h, which scroll-padding-top uses.
    <header className="sticky top-0 z-40 h-(--header-h) border-b border-border bg-bg/85 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between gap-3">
        <Link href="/#top" className="text-sm font-semibold tracking-tight whitespace-nowrap sm:text-base">
          {site.name}
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <nav aria-label={shellCopy.primaryNavLabel} className="hidden md:block">
            <ul className="flex items-center gap-1">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-text-muted transition-colors duration-150 ease-out hover:text-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* Wrapper owns the visibility: ButtonLink's own inline-flex would override `hidden`. */}
          <div className="mx-2 hidden md:block">
            <ButtonLink href={site.cvHref} download variant="secondary">
              {shellCopy.cv}
            </ButtonLink>
          </div>
          <ThemeToggle />
          <div className="md:hidden">
            <MobileMenu items={primaryNav} cvHref={site.cvHref} />
          </div>
        </div>
      </Container>
    </header>
  );
}
