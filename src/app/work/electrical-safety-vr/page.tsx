import type { Metadata } from "next";
import { electricalSafetyVr as project, teamLine, xrCopy } from "@/content/xr";
import { CaseStudyGallery } from "@/components/case-study/case-study-gallery";
import { CaseStudyHeader } from "@/components/case-study/case-study-header";
import { CaseStudyPager } from "@/components/case-study/case-study-pager";
import { CaseStudySection } from "@/components/case-study/case-study-section";
import { ChallengeCards } from "@/components/case-study/challenge-cards";
import { NumberedSteps } from "@/components/case-study/numbered-steps";
import { caseStudyAccentLink } from "@/components/case-study/text-link";
import { XrVideo } from "@/components/case-study/xr-video";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { GitHubIcon } from "@/components/ui/icons";
import { baseOpenGraph } from "@/lib/seo";

const { caseStudy, images } = project;

const PATH = "/work/electrical-safety-vr";

const shareImage = {
  url: images.overview.src,
  width: images.overview.width,
  height: images.overview.height,
  alt: images.overview.alt,
};

// Sets both og and twitter images, so the root's generated share image doesn't replace overview.png.
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
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${project.title}: ${project.fullTitle}`,
    description: project.spotlightBlurb,
    images: [shareImage],
  },
};

export default function ElectricalSafetyVrPage() {
  return (
    <article aria-labelledby="case-study-heading">
      <CaseStudyHeader
        project={project}
        note={project.platform}
        actions={
          <ButtonLink href={project.repo} variant="secondary">
            <GitHubIcon className="size-4" />
            {xrCopy.repoCta}
          </ButtonLink>
        }
      />

      <Container>
        <XrVideo video={project.video} poster={images.overview} shape={project.screenshotShape} />

        <CaseStudySection id="problem" heading={xrCopy.headings.problem}>
          <p className="mt-4 max-w-prose sm:text-lg">{caseStudy.problem}</p>
        </CaseStudySection>

        <CaseStudySection id="trainee-steps" heading={xrCopy.headings.traineeSteps}>
          <NumberedSteps steps={caseStudy.traineeSteps} />
          <p className="mt-6 max-w-prose text-sm">{caseStudy.alsoIncluded}</p>
        </CaseStudySection>

        <CaseStudySection id="role" heading={xrCopy.headings.role} prominent>
          <ul className="mt-6 max-w-prose list-disc space-y-2 pl-5 marker:text-accent sm:text-lg">
            {caseStudy.role.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CaseStudySection>

        <CaseStudySection id="challenges" heading={xrCopy.headings.challenges} prominent>
          <ChallengeCards challenges={caseStudy.technicalChallenges} />
        </CaseStudySection>

        <CaseStudySection id="outcome" heading={xrCopy.headings.outcome}>
          <p className="mt-4 max-w-prose sm:text-lg">{caseStudy.outcome}</p>
        </CaseStudySection>

        <CaseStudySection id="gallery" heading={xrCopy.headings.gallery}>
          <CaseStudyGallery images={images.gallery} shape={project.screenshotShape} />
        </CaseStudySection>

        <CaseStudySection id="credits" heading={xrCopy.headings.credits}>
          <p className="mt-4 max-w-prose">
            {xrCopy.builtWith} {teamLine(project.team)}.
          </p>
          <p className="mt-3 max-w-prose text-sm text-text-muted">{caseStudy.credits.assets}</p>
          <p className="mt-2">
            <a href={caseStudy.credits.creditsFile.href} className={caseStudyAccentLink}>
              {caseStudy.credits.creditsFile.label}
            </a>
          </p>
        </CaseStudySection>

        <CaseStudyPager slug={project.slug} />
      </Container>
    </article>
  );
}
