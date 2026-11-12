import type { CompactProject } from "@/content/projects";
import { cx } from "@/lib/cx";
import { withCountUp } from "@/lib/measured";
import { Badge } from "./badge";
import { cardHover } from "./card";
import { CollapsibleTagList } from "./collapsible-tag-list";
import { GitHubIcon } from "./icons";
import { ScanFrame } from "./scan-frame";

type CompactProjectCardProps = {
  project: CompactProject;
};

/**
 * A lighter, secondary project card: no surface fill, tighter padding, smaller type.
 * Same layout logic as ProjectCard, so DOM order is summary → details → link.
 */
export function CompactProjectCard({ project }: CompactProjectCardProps) {
  const headingId = `project-${project.slug}`;

  return (
    <article
      aria-labelledby={headingId}
      data-scan={project.slug}
      className={cx("relative rounded-lg border border-border p-4 sm:p-5 lg:grid lg:grid-cols-2 lg:gap-x-10", cardHover)}
    >
      <div className="lg:col-start-1 lg:row-start-1">
        <div className="flex flex-wrap gap-2">
          <Badge>{project.year}</Badge>
          <Badge>{project.type}</Badge>
          <Badge>{project.status}</Badge>
        </div>

        <h3 id={headingId} className="mt-3 text-lg font-semibold tracking-tight">
          {project.title}
        </h3>

        <p className="mt-2 max-w-measure text-sm text-text-muted">{project.blurb}</p>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
        <ul className="max-w-measure list-disc space-y-1 pl-5 text-sm marker:text-accent">
          {project.highlights.map((highlight) => (
            <li key={highlight}>{withCountUp(highlight, project.countUp)}</li>
          ))}
        </ul>

        <CollapsibleTagList tags={project.stack} />
      </div>

      <p className="pt-4 lg:col-start-1 lg:row-start-2 lg:self-end">
        <a
          href={project.link.href}
          className="group -mx-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-accent hover:underline hover:underline-offset-4"
        >
          <GitHubIcon className="size-4" />
          {project.link.label}
          <span aria-hidden="true" className="transition-transform duration-fast ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5">
            →
          </span>
        </a>
      </p>

      <ScanFrame />
    </article>
  );
}
