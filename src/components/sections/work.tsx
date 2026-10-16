import { moreOnGitHub, projects, workCopy } from "@/content/projects";
import { GitHubIcon } from "@/components/ui/icons";
import { ProjectCard } from "@/components/ui/project-card";
import { Section } from "@/components/ui/section";

export function Work() {
  return (
    <Section id="work">
      <p className="mt-3 max-w-prose text-text-muted sm:text-lg">{workCopy.intro}</p>

      <ul role="list" className="mt-10 flex flex-col gap-6">
        {projects.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>

      <p className="mt-8">
        <a
          href={moreOnGitHub.href}
          className="group -mx-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-medium text-text transition-colors duration-150 ease-out hover:text-accent"
        >
          <GitHubIcon className="size-5" />
          {moreOnGitHub.label}
          <span aria-hidden="true" className="transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5">
            →
          </span>
        </a>
      </p>
    </Section>
  );
}
