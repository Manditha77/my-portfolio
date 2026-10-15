import Image from "next/image";
import Link from "next/link";
import { caseStudyHref, electricalSafetyVr, xrCopy } from "@/content/xr";
import { ButtonLink, buttonBase, buttonVariants } from "@/components/ui/button-link";
import { GitHubIcon } from "@/components/ui/icons";
import { Section } from "@/components/ui/section";
import { TagList } from "@/components/ui/tag";
import { cx } from "@/lib/cx";

export function XrSpotlight() {
  const project = electricalSafetyVr;
  const image = project.images.overview;
  const headingId = `project-${project.slug}`;

  return (
    <Section id="vr-ar" anchorAliases={["xr"]} heading={xrCopy.heading} data-mode="xr">
      <p className="mt-3 max-w-prose text-text-muted sm:text-lg">{xrCopy.subtitle}</p>

      <article
        aria-labelledby={headingId}
        className="xr-glow mt-10 grid gap-6 rounded-lg border border-accent/30 bg-surface p-5 sm:p-6 lg:grid-cols-2 lg:items-center lg:gap-10"
      >
        <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-bg lg:col-start-2 lg:row-start-1">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(min-width: 1024px) 520px, 100vw"
            className="size-full object-cover"
          />
        </div>

        <div className="lg:col-start-1 lg:row-start-1">
          <h3 id={headingId} className="text-xl font-semibold tracking-tight">
            {project.title}
          </h3>
          <p className="mt-1 text-sm text-text-muted">{project.fullTitle}</p>

          <p className="mt-3">{project.spotlightBlurb}</p>

          <TagList tags={project.stack} label={xrCopy.stackLabel} tone="accent" className="mt-5" />

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={caseStudyHref(project)} className={cx(buttonBase, buttonVariants.primary)}>
              {xrCopy.caseStudyCta}
              <span aria-hidden="true">→</span>
            </Link>
            <ButtonLink href={project.repo} variant="secondary">
              <GitHubIcon className="size-4" />
              {xrCopy.repoCta}
            </ButtonLink>
          </div>
        </div>
      </article>
    </Section>
  );
}
