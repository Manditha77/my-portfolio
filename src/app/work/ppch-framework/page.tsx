import type { Metadata } from "next";
import { ppchFramework as project, workCopy } from "@/content/projects";
import { sectionHeading } from "@/content/navigation";
import { CaseStudyHeader } from "@/components/case-study/case-study-header";
import { CaseStudyPager } from "@/components/case-study/case-study-pager";
import { CaseStudySection } from "@/components/case-study/case-study-section";
import { NumberedSteps } from "@/components/case-study/numbered-steps";
import { ResultCard } from "@/components/case-study/result-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { GitHubIcon } from "@/components/ui/icons";
import { ScanObserver } from "@/components/ui/scan-observer";
import { baseOpenGraph } from "@/lib/seo";

const { caseStudy } = project;
const { dataset, models, actEngine, deployed } = caseStudy.results;

const PATH = "/work/ppch-framework";
const shareTitle = `${project.title}: ${project.subtitle}`;

// The share images come from opengraph-image.tsx and twitter-image.tsx in this folder (the root image).
export const metadata: Metadata = {
  title: project.title,
  description: project.blurb,
  alternates: { canonical: PATH },
  openGraph: {
    ...baseOpenGraph,
    type: "article",
    url: PATH,
    title: shareTitle,
    description: project.blurb,
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: project.blurb,
  },
};

const cell = "py-2 pr-3 last:pr-0";

export default function PpchFrameworkPage() {
  return (
    <article aria-labelledby="case-study-heading">
      <CaseStudyHeader
        project={{
          title: project.title,
          fullTitle: project.subtitle,
          context: [project.type, project.year, project.status].join(" · "),
          stack: project.stack,
        }}
        label={sectionHeading("work")}
        note={caseStudy.note}
        actions={
          <ButtonLink href={project.repo} variant="secondary">
            <GitHubIcon className="size-4" />
            {workCopy.repoCta}
          </ButtonLink>
        }
      />

      <Container>
        <CaseStudySection id="problem" heading={workCopy.headings.problem}>
          <p className="mt-4 max-w-measure sm:text-lg">{caseStudy.problem}</p>
        </CaseStudySection>

        <CaseStudySection id="how-it-works" heading={workCopy.headings.howItWorks}>
          <NumberedSteps steps={caseStudy.howItWorks} />
        </CaseStudySection>

        <CaseStudySection id="results" heading={workCopy.headings.results} prominent>
          <ul role="list" className="mt-6 grid gap-6 lg:grid-cols-2">
            <li>
              <ResultCard id="ppch-dataset" heading={dataset.heading}>
                <ol role="list" className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
                  {dataset.funnel.map((step) => (
                    <li key={step.label} className="border-l border-accent/40 pl-3">
                      <span className="block text-2xl font-semibold tracking-tight tabular-nums">{step.count}</span>
                      <span className="mt-0.5 block text-sm text-text-muted">{step.label}</span>
                    </li>
                  ))}
                </ol>
              </ResultCard>
            </li>

            <li>
              <ResultCard id="ppch-models" heading={models.heading}>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="mb-2 text-left text-text-muted">{models.caption}</caption>
                    <thead>
                      <tr className="border-b border-border font-mono text-xs text-text-muted">
                        <th scope="col" className={`${cell} font-normal`}>{workCopy.modelColumn}</th>
                        <th scope="col" className={`${cell} font-normal`}>{workCopy.aucColumn}</th>
                        <th scope="col" className={`${cell} font-normal`}>{workCopy.intervalColumn}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {models.rows.map((row) => (
                        <tr key={row.model}>
                          <th scope="row" className={`${cell} ${row.best ? "font-medium" : "font-normal"}`}>
                            {row.model}
                            {row.best && (
                              <span className="ml-2 rounded-sm border border-accent/40 px-1.5 py-0.5 font-mono text-xs text-accent-ink">
                                {workCopy.best}
                              </span>
                            )}
                          </th>
                          <td className={`${cell} tabular-nums ${row.best ? "font-medium text-accent-ink" : ""}`}>{row.auc}</td>
                          <td className={`${cell} whitespace-nowrap tabular-nums text-text-muted`}>{row.interval ?? "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ResultCard>
            </li>

            <li>
              <ResultCard id="ppch-act" heading={actEngine.heading}>
                <p className="mt-3 max-w-measure text-sm">{actEngine.intro}</p>
                <ul className="mt-2 max-w-measure list-disc space-y-1 pl-5 text-sm marker:text-accent-ink">
                  {actEngine.checks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
                <ul role="list" className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  {actEngine.outcomes.map((outcome) => (
                    <li key={outcome} className="font-medium">
                      {outcome}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            </li>

            <li>
              <ResultCard id="ppch-deployed" heading={deployed.heading}>
                {deployed.body.map((line) => (
                  <p key={line} className="mt-3 max-w-measure text-sm">
                    {line}
                  </p>
                ))}
              </ResultCard>
            </li>
          </ul>
        </CaseStudySection>

        <CaseStudySection id="limitations" heading={workCopy.headings.limitations}>
          <p className="mt-4 max-w-measure sm:text-lg">{caseStudy.limitations}</p>
        </CaseStudySection>

        <CaseStudyPager slug={project.slug} />
        <ScanObserver />
      </Container>
    </article>
  );
}
