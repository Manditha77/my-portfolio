import Link from "next/link";
import { primaryNav, shellCopy } from "@/content/navigation";
import { site } from "@/content/site";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { MotionToggle } from "@/components/ui/motion-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DesktopNav } from "./desktop-nav";
import { HeaderMark } from "./header-mark";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  return (
    // Fixed height (border included) so it always matches --header-h, which scroll-padding-top uses.
    <header className="sticky top-0 z-40 h-(--header-h) border-b border-border bg-bg/85 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between gap-3">
        <Link
          href="/#top"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight whitespace-nowrap sm:text-base"
        >
          <HeaderMark />
          {site.name}
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <DesktopNav items={primaryNav} />
          {/* Wrapper owns the visibility: ButtonLink's own inline-flex would override `hidden`. */}
          <div className="mx-2 hidden md:block">
            <ButtonLink href={site.cvHref} download variant="secondary">
              {shellCopy.cv}
            </ButtonLink>
          </div>
          <MotionToggle />
          <ThemeToggle />
          <div className="md:hidden">
            <MobileMenu items={primaryNav} cvHref={site.cvHref} />
          </div>
        </div>
      </Container>
      {/* Scroll progress: the build beam along the bottom edge (CSS only, .header-progress). */}
      <span aria-hidden="true" className="header-progress" />
    </header>
  );
}
