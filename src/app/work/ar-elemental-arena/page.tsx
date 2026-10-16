import type { Metadata } from "next";
import Image from "next/image";
import { arElementalArena as project, xrCopy } from "@/content/xr";
import { CaseStudyGallery } from "@/components/case-study/case-study-gallery";
import { CaseStudyHeader } from "@/components/case-study/case-study-header";
import { CaseStudyPager } from "@/components/case-study/case-study-pager";
import { CaseStudySection } from "@/components/case-study/case-study-section";
import { ChallengeCards } from "@/components/case-study/challenge-cards";
import { NumberedSteps, SimpleSteps } from "@/components/case-study/numbered-steps";
import { caseStudyAccentLink } from "@/components/case-study/text-link";
import { XrVideo } from "@/components/case-study/xr-video";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { GitHubIcon } from "@/components/ui/icons";
import { LiveDemoLink } from "@/components/ui/live-demo-link";
import { baseOpenGraph } from "@/lib/seo";

const { caseStudy, images } = project;

const PATH = "/work/ar-elemental-arena";

// The share images come from opengraph-image.tsx and twitter-image.tsx in this folder.
export const metadata: Metadata = {
  title: project.title,
  description: project.spotlightBlurb,
  alternates: { canonical: PATH },
  openGraph: {
    ...baseOpenGraph,
    type: "article",
    url: PATH,
    title: `${project.title}: ${project.fullTitle}`,
    description: project.spotlightBlurb,
  },
  twitter: {
    card: "summary_large_image",
    title: `${project.title}: ${project.fullTitle}`,
    description: project.spotlightBlurb,
  },
};

export default function ArElementalArenaPage() {
  return (
    <article aria-labelledby="case-study-heading">
      <CaseStudyHeader
        project={project}
        note={project.runsOn}
        actions={
          <>
            <LiveDemoLink href={project.liveDemoUrl} />
            <ButtonLink href={project.repo} variant="secondary">
              <GitHubIcon className="size-4" />
              {xrCopy.repoCta}
            </ButtonLink>
          </>
        }
      />

      <Container>
        <XrVideo video={project.video} poster={images.overview} shape={project.screenshotShape} />

        <CaseStudySection id="idea" heading={xrCopy.headings.idea}>
          <p className="mt-4 max-w-prose sm:text-lg">{caseStudy.idea}</p>
        </CaseStudySection>

        <CaseStudySection id="how-it-plays" heading={xrCopy.headings.howItPlays}>
          <NumberedSteps steps={caseStudy.howItPlays} />
        </CaseStudySection>

        <CaseStudySection id="try-it" heading={xrCopy.headings.tryIt}>
          <p className="mt-4 max-w-prose">{caseStudy.tryItYourself.requirement}</p>
          <SimpleSteps steps={caseStudy.tryItYourself.steps} />
          <div className="mt-6">
            <LiveDemoLink href={project.liveDemoUrl} />
          </div>

          {/* Plain tiles with no glow or overlay, so a phone camera can track the artwork. */}
          <ul role="list" className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {project.summonCards.map((card) => (
              <li key={card.src}>
                <figure>
                  <Image
                    src={card.src}
                    alt={card.alt}
                    width={card.width}
                    height={card.height}
                    sizes="(min-width: 1100px) 260px, (min-width: 1024px) 25vw, 50vw"
                    className="h-auto w-full rounded-md"
                  />
                  <figcaption className="mt-1 flex flex-wrap items-center justify-between gap-x-3">
                    <span className="text-sm text-text-muted">{card.alt}</span>
                    <a href={card.src} target="_blank" rel="noopener noreferrer" className={caseStudyAccentLink}>
                      {xrCopy.openFullSize}
                      <span className="sr-only">
                        : {card.alt} {xrCopy.opensNewTab}
                      </span>
                    </a>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </CaseStudySection>

        <CaseStudySection id="built" heading={xrCopy.headings.built} prominent>
          <p className="mt-6 max-w-prose sm:text-lg">{caseStudy.built}</p>
        </CaseStudySection>

        <CaseStudySection id="challenges" heading={xrCopy.headings.challenges} prominent>
          <ChallengeCards challenges={caseStudy.technicalChallenges} />
        </CaseStudySection>

        <CaseStudySection id="learned" heading={xrCopy.headings.learned}>
          <p className="mt-4 max-w-prose sm:text-lg">{caseStudy.learned}</p>
        </CaseStudySection>

        <CaseStudySection id="gallery" heading={xrCopy.headings.gallery}>
          <CaseStudyGallery images={images.gallery} shape={project.screenshotShape} />
        </CaseStudySection>

        <CaseStudySection id="credits" heading={xrCopy.headings.credits}>
          <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5 text-sm marker:text-accent">
            {caseStudy.credits.map((credit) => (
              <li key={credit.text}>
                {credit.text}
                {credit.link && (
                  <>
                    {" "}
                    {xrCopy.articleCredit}{" "}
                    <a
                      href={credit.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent underline underline-offset-4 hover:no-underline"
                    >
                      {credit.link.label}
                      <span className="sr-only"> {xrCopy.opensNewTab}</span>
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CaseStudySection>

        <CaseStudyPager slug={project.slug} />
      </Container>
    </article>
  );
}
