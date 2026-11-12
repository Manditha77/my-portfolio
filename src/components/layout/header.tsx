import Link from "next/link";
import { primaryNav, shellCopy } from "@/content/navigation";
import { site } from "@/content/site";
import { BootBlock } from "@/components/ui/boot-block";
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
    <header className="site-header sticky top-0 z-40 h-(--header-h) border-b border-border bg-bg/85 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between gap-3">
        <Link
          href="/#top"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight whitespace-nowrap sm:text-base"
        >
          <HeaderMark>
            <BootBlock target="mark" />
          </HeaderMark>
          {/* In the cube boot the name slides out from behind the mark. */}
          <span className="boot-brand-clip">
            <span className="boot-brand-name inline-block">{site.name}</span>
          </span>
        </Link>

        {/* The boot reveals the nav links, then these controls in order (globals.css). */}
        <div className="boot-tools flex shrink-0 items-center gap-1">
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
