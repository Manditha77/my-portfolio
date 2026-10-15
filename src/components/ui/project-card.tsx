import Image from "next/image";
import type { Project } from "@/content/projects";
import { workCopy } from "@/content/projects";
import { cx } from "@/lib/cx";
import { Badge } from "./badge";
import { GitHubIcon } from "./icons";
import { TagList } from "./tag";

type ProjectCardProps = {
  project: Project;
  /** Full-width card with two inner columns on large screens. */
  featured?: boolean;
};

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const headingId = `project-${project.slug}`;
  const image = project.media?.[0];
  // With a screenshot, the featured card puts it in the right column and moves the details under the blurb.
  const mediaBeside = featured && Boolean(image);

  const media = image ? (
    <div
      className={cx(
        "relative overflow-hidden rounded-md border border-border bg-bg",
        featured ? "aspect-[16/10]" : "aspect-video",
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="(min-width: 1024px) 520px, 100vw"
        className="size-full object-cover"
      />
    </div>
  ) : null;

  const details = (
    <>
      {project.highlights && project.highlights.length > 0 ? (
        <ul className="list-disc space-y-1.5 pl-5 text-sm marker:text-accent">
          {project.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      ) : null}

      {project.approach && project.approach.length > 0 ? (
        <div>
          <p className="font-mono text-xs text-text-muted">{workCopy.approachHeading}</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {project.approach.map((step) => (
              <li key={step.label}>
                <span className="font-medium text-accent">{step.label}:</span> {step.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <TagList tags={project.stack} />
    </>
  );

  return (
    <article
      aria-labelledby={headingId}
      className={cx(
        "flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors duration-200 ease-out focus-within:border-accent hover:border-accent/60 sm:p-6",
        featured && "lg:grid lg:grid-cols-2 lg:gap-10",
      )}
    >
      {media && (!featured || mediaBeside) ? (
        <div className={cx("mb-5", mediaBeside && "lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mb-0")}>
          {media}
        </div>
      ) : null}

      <div className={cx("flex flex-col", mediaBeside && "lg:col-start-1 lg:row-start-1")}>
        <div className="flex flex-wrap gap-2">
          <Badge>{project.year}</Badge>
          <Badge>{project.type}</Badge>
          {project.status ? <Badge>{project.status}</Badge> : null}
        </div>

        <h3 id={headingId} className="mt-4 text-xl font-semibold tracking-tight">
          {project.title}
        </h3>
        {project.subtitle ? <p className="mt-1 text-sm text-text-muted">{project.subtitle}</p> : null}

        <p className="mt-3">{project.blurb}</p>

        {project.role ? (
          <p className="mt-3 text-sm">
            <span className="font-medium">{workCopy.roleLabel}</span> {project.role}
          </p>
        ) : null}

        {project.statusNote ? <p className="mt-3 text-sm text-text-muted">{project.statusNote}</p> : null}

        {mediaBeside ? <div className="mt-5 flex flex-col gap-5">{details}</div> : null}
      </div>

      {mediaBeside ? null : (
        <div className={cx("mt-5 flex flex-col gap-5", featured && "lg:row-span-2 lg:mt-0")}>{details}</div>
      )}

      <p className={cx("mt-auto pt-5", featured && "lg:pt-6", mediaBeside && "lg:col-start-1")}>
        <a
          href={project.repo}
          className="group -mx-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-accent hover:underline hover:underline-offset-4"
        >
          <GitHubIcon className="size-4" />
          <span>
            {workCopy.repoLink}
            <span className="sr-only"> for {project.title}</span> {workCopy.repoLinkSuffix}
          </span>
          <span aria-hidden="true" className="transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5">
            →
          </span>
        </a>
      </p>
    </article>
  );
}
