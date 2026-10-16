import Link from "next/link";
import type { ReactNode } from "react";
import type { XrProjectBase } from "@/content/xr";
import { xrCopy } from "@/content/xr";
import { Container } from "@/components/ui/container";
import { TagList } from "@/components/ui/tag";
import { camelCaseBreaks } from "@/lib/word-breaks";
import { caseStudyTextLink } from "./text-link";

type CaseStudyHeaderProps = {
  project: XrProjectBase;
  /** A short line under the context, e.g. the platform or where the demo runs. */
  note: string;
  /** The buttons under the tech tags. */
  actions: ReactNode;
};

/** The case study's back link, h1 and summary, on the same "mode shift" backdrop as the home section. */
export function CaseStudyHeader({ project, note, actions }: CaseStudyHeaderProps) {
  return (
    <div data-mode="xr">
      <Container>
        <p className="pt-6">
          <Link href="/" className={caseStudyTextLink}>
            <span aria-hidden="true">←</span>
            {xrCopy.backToHome}
          </Link>
        </p>

        <header className="pt-6 pb-8">
          <p className="font-mono text-xs text-accent">{xrCopy.heading}</p>
          <h1 id="case-study-heading" className="mt-3 text-display font-semibold tracking-tight wrap-break-word">
            {camelCaseBreaks(project.title)}
          </h1>
          <p className="mt-3 text-lg text-text-muted sm:text-xl">{project.fullTitle}</p>
          <p className="mt-5 max-w-prose">{project.context}</p>
          <p className="mt-2 max-w-prose text-sm text-text-muted">{note}</p>
          <TagList tags={project.stack} label={xrCopy.stackLabel} tone="accent" className="mt-6" />
          <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
        </header>
      </Container>
    </div>
  );
}
