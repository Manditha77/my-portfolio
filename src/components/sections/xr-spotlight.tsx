import Image from "next/image";
import Link from "next/link";
import type { XrProject } from "@/content/xr";
import { caseStudyHref, xrCopy, xrProjects } from "@/content/xr";
import { ButtonLink, buttonBase, buttonVariants } from "@/components/ui/button-link";
import { GitHubIcon } from "@/components/ui/icons";
import { LiveDemoLink } from "@/components/ui/live-demo-link";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { Section } from "@/components/ui/section";
import { TagList } from "@/components/ui/tag";
import { cx } from "@/lib/cx";

export function XrSpotlight() {
  return (
    <Section id="vr-ar" anchorAliases={["xr"]} heading={xrCopy.heading} data-mode="xr">
      <p className="mt-3 max-w-prose text-text-muted sm:text-lg">{xrCopy.subtitle}</p>

      <ul role="list" className="mt-10 space-y-8">
        {xrProjects.map((project) => (
          <li key={project.slug}>
            <XrProjectCard project={project} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function XrProjectCard({ project }: { project: XrProject }) {
  const image = project.images.overview;
  const headingId = `project-${project.slug}`;
  const phone = project.screenshotShape === "phone";
  const liveDemoUrl = "liveDemoUrl" in project ? project.liveDemoUrl : undefined;

  const picture = (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={phone ? "192px" : "(min-width: 1024px) 520px, 100vw"}
      className="size-full object-cover"
    />
  );

  return (
    <article
      aria-labelledby={headingId}
      className={cx(
        "xr-glow grid gap-6 rounded-lg border border-accent/30 bg-surface p-5 sm:p-6",
        // A phone screenshot sits beside the text from tablet width; a 16:9 one only on large screens.
        phone ? "sm:grid-cols-[1fr_auto] sm:items-center sm:gap-10" : "lg:grid-cols-2 lg:items-center lg:gap-10",
      )}
    >
      {phone ? (
        <PhoneFrame className="mx-auto w-40 sm:col-start-2 sm:row-start-1 sm:w-48">{picture}</PhoneFrame>
      ) : (
        <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-bg lg:col-start-2 lg:row-start-1">
          {picture}
        </div>
      )}

      <div className={phone ? "sm:col-start-1 sm:row-start-1" : "lg:col-start-1 lg:row-start-1"}>
        <h3 id={headingId} className="text-xl font-semibold tracking-tight">
          {project.title}
        </h3>
        <p className="mt-1 text-sm text-text-muted">{project.fullTitle}</p>

        <p className="mt-3">{project.spotlightBlurb}</p>

        <TagList tags={project.stack} label={xrCopy.stackLabel} tone="accent" className="mt-5" />

        <div className="mt-6 flex flex-wrap gap-3">
          {liveDemoUrl && <LiveDemoLink href={liveDemoUrl} />}
          <Link
            href={caseStudyHref(project)}
            className={cx(buttonBase, liveDemoUrl ? buttonVariants.secondary : buttonVariants.primary)}
          >
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
  );
}
