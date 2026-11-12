import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/projects";
import { workCopy } from "@/content/projects";
import { caseStudyHref } from "@/content/case-studies";
import { cx } from "@/lib/cx";
import { withCountUp } from "@/lib/measured";
import { Badge } from "./badge";
import { ButtonLink, buttonBase, buttonVariants } from "./button-link";
import { cardHover } from "./card";
import { CollapsibleTagList } from "./collapsible-tag-list";
import { GitHubIcon } from "./icons";
import { ScanFrame } from "./scan-frame";
import { StatChips } from "./stat-chips";

type ProjectCardProps = {
  project: Project;
};

/**
 * Full-width project card: a one-sentence blurb with stat chips or a few bullets; the detail lives in the
 * case study, when there is one. On large screens: summary and links on the left, details and tags on the
 * right. DOM order is summary → details → links, so the single mobile column ends with the links.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const headingId = `project-${project.slug}`;
  const image = project.media?.[0];

  return (
    <article
      aria-labelledby={headingId}
      data-scan={project.slug}
      className={cx("relative rounded-lg border border-border bg-surface p-5 sm:p-6 lg:grid lg:grid-cols-2 lg:gap-x-10", cardHover)}
    >
      <div className="lg:col-start-1 lg:row-start-1">
        <div className="flex flex-wrap gap-2">
          <Badge>{project.year}</Badge>
          <Badge>{project.type}</Badge>
          {project.status ? <Badge>{project.status}</Badge> : null}
        </div>

        <h3 id={headingId} className="mt-4 text-xl font-semibold tracking-tight">
          {project.title}
        </h3>
        {project.subtitle ? <p className="mt-1 text-sm text-text-muted">{project.subtitle}</p> : null}

        <p className="mt-3 max-w-measure">{withCountUp(project.blurb, project.countUp)}</p>

        {project.chips && project.chips.length > 0 ? (
          <StatChips chips={project.chips} countUp={project.countUp} label={workCopy.chipsLabel} className="mt-4" />
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
        {image ? (
          <div className="relative aspect-16/10 overflow-hidden rounded-md border border-border bg-bg">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 520px, 100vw"
              className="size-full object-cover"
            />
          </div>
        ) : null}

        {project.highlights && project.highlights.length > 0 ? (
          <ul className="max-w-measure list-disc space-y-1.5 pl-5 text-sm marker:text-accent-ink">
            {project.highlights.map((highlight) => (
              <li key={highlight}>{withCountUp(highlight, project.countUp)}</li>
            ))}
          </ul>
        ) : null}

        <CollapsibleTagList tags={project.stack} />
      </div>

      {project.caseStudy ? (
        <div className="mt-6 flex flex-wrap gap-3 lg:col-start-1 lg:row-start-2 lg:self-end">
          <Link href={caseStudyHref(project)} className={cx(buttonBase, buttonVariants.primary)}>
            {workCopy.caseStudyCta}
            <span className="sr-only">: {project.title}</span>
            <span aria-hidden="true">→</span>
          </Link>
          <ButtonLink href={project.repo} variant="secondary">
            <GitHubIcon className="size-4" />
            {workCopy.repoCta}
            <span className="sr-only"> for {project.title}</span>
          </ButtonLink>
        </div>
      ) : (
        <p className="pt-5 lg:col-start-1 lg:row-start-2 lg:self-end">
          <a
            href={project.repo}
            className="group -mx-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-accent-ink hover:underline hover:underline-offset-4"
          >
            <GitHubIcon className="size-4" />
            <span>
              {workCopy.repoLink}
              <span className="sr-only"> for {project.title}</span> {workCopy.repoLinkSuffix}
            </span>
            <span aria-hidden="true" className="transition-transform duration-fast ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5">
              →
            </span>
          </a>
        </p>
      )}

      <ScanFrame />
    </article>
  );
}
