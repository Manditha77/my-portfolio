import Link from "next/link";
import { caseStudies, caseStudyHref } from "@/content/case-studies";
import { xrCopy } from "@/content/xr";
import { linkCardHover } from "@/components/ui/card";
import { caseStudyTextLink } from "./text-link";

type CaseStudyPagerProps = {
  slug: string;
};

const pagerLink =
  `group flex min-h-11 flex-col gap-1 rounded-lg border border-border bg-surface p-4 sm:p-5 ${linkCardHover}`;

/** Previous/next links between the case studies (in `caseStudies` order), then the links back into the home page. */
export function CaseStudyPager({ slug }: CaseStudyPagerProps) {
  const index = caseStudies.findIndex((entry) => entry.slug === slug);
  const current = caseStudies[index];
  const previous = index > 0 ? caseStudies[index - 1] : undefined;
  const next = index >= 0 && index < caseStudies.length - 1 ? caseStudies[index + 1] : undefined;

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

      {current && (
        <nav aria-label={xrCopy.pageNavLabel} className="mt-6 flex flex-wrap justify-between gap-4">
          <Link href={current.backTo.href} className={caseStudyTextLink}>
            <span aria-hidden="true">←</span>
            {current.backTo.label}
          </Link>
          <Link href={current.next.href} className={caseStudyTextLink}>
            {current.next.label}
            <span aria-hidden="true">→</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
