import Link from "next/link";
import { caseStudyHref, xrCopy, xrProjects } from "@/content/xr";
import { caseStudyTextLink } from "./text-link";

type CaseStudyPagerProps = {
  slug: string;
};

const pagerLink =
  "group flex min-h-11 flex-col gap-1 rounded-lg border border-border bg-surface p-4 transition-colors duration-150 ease-out hover:border-accent/60 sm:p-5";

/** Previous/next links between the VR / AR case studies, then the links back into the home page. */
export function CaseStudyPager({ slug }: CaseStudyPagerProps) {
  const index = xrProjects.findIndex((project) => project.slug === slug);
  const previous = index > 0 ? xrProjects[index - 1] : undefined;
  const next = index >= 0 && index < xrProjects.length - 1 ? xrProjects[index + 1] : undefined;

  return (
    <div className="border-t border-border py-8">
      {(previous ?? next) && (
        <nav aria-label={xrCopy.caseStudyNavLabel}>
          <ul role="list" className="grid gap-4 sm:grid-cols-2">
            {previous && (
              <li>
                <Link href={caseStudyHref(previous)} className={pagerLink}>
                  <span className="font-mono text-xs text-text-muted">
                    <span aria-hidden="true">← </span>
                    {xrCopy.previousCaseStudy}
                  </span>
                  <span className="font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {previous.title}
                  </span>
                </Link>
              </li>
            )}
            {next && (
              <li className="sm:col-start-2">
                <Link href={caseStudyHref(next)} className={`${pagerLink} sm:items-end sm:text-right`}>
                  <span className="font-mono text-xs text-text-muted">
                    {xrCopy.nextCaseStudy}
                    <span aria-hidden="true"> →</span>
                  </span>
                  <span className="font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {next.title}
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}

      <nav aria-label={xrCopy.pageNavLabel} className="mt-6 flex flex-wrap justify-between gap-4">
        <Link href="/#vr-ar" className={caseStudyTextLink}>
          <span aria-hidden="true">←</span>
          {xrCopy.backToSection}
        </Link>
        <Link href="/#experience" className={caseStudyTextLink}>
          {xrCopy.nextSection}
          <span aria-hidden="true">→</span>
        </Link>
      </nav>
    </div>
  );
}
