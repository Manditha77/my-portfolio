import type { ComponentType, SVGProps } from "react";
import { site } from "@/content/site";
import { cx } from "@/lib/cx";
import { IconLink } from "./icon-link";
import { GitHubIcon, LinkedInIcon, MediumIcon } from "./icons";

type Social = {
  label: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const socials: readonly Social[] = [
  { ...site.links.linkedin, Icon: LinkedInIcon },
  { ...site.links.github, Icon: GitHubIcon },
  { ...site.links.medium, Icon: MediumIcon },
];

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

type SocialLinksProps = {
  /** "text": icon and label (Contact). "icon": icon only, named by aria-label (Footer). */
  variant: "text" | "icon";
  className?: string;
};

export function SocialLinks({ variant, className }: SocialLinksProps) {
  const { opensNewTab } = site.contact;

  return (
    <ul role="list" className={cx("flex flex-wrap", variant === "text" ? "gap-x-6 gap-y-1" : "gap-1", className)}>
      {socials.map(({ label, href, Icon }) => (
        <li key={href}>
          {variant === "icon" ? (
            <IconLink href={href} label={`${label} ${opensNewTab}`} {...external}>
              <Icon />
            </IconLink>
          ) : (
            <a
              href={href}
              {...external}
              className="inline-flex min-h-11 items-center gap-2 font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors duration-150 hover:decoration-accent"
            >
              <Icon />
              {label}
              <span className="sr-only"> {opensNewTab}</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
