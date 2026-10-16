import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { electricalSafetyVr as project, teamLine, xrCopy } from "@/content/xr";
import { CaseStudySection } from "@/components/case-study/case-study-section";
import { XrVideo } from "@/components/case-study/xr-video";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { GitHubIcon } from "@/components/ui/icons";
import { TagList } from "@/components/ui/tag";
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

const textLink =
  "group -mx-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-text-muted transition-colors duration-150 ease-out hover:text-accent";

export default function ElectricalSafetyVrPage() {
  return (
    <article aria-labelledby="case-study-heading">
      {/* The same "mode shift" backdrop as the home section, behind the page header only. */}
      <div data-mode="xr">
        <Container>
          <p className="pt-6">
            <Link href="/" className={textLink}>
              <span aria-hidden="true">←</span>
              {xrCopy.backToHome}
            </Link>
          </p>
  
          <header className="pt-6 pb-8">
            <p className="font-mono text-xs text-accent">{xrCopy.heading}</p>
            <h1 id="case-study-heading" className="mt-3 text-display font-semibold tracking-tight">
              {project.title}
            </h1>
            <p className="mt-3 text-lg text-text-muted sm:text-xl">{project.fullTitle}</p>
            <p className="mt-5 max-w-prose">{project.context}</p>
            <p className="mt-2 max-w-prose text-sm text-text-muted">{project.platform}</p>
            <TagList tags={project.stack} label={xrCopy.stackLabel} tone="accent" className="mt-6" />
            <div className="mt-6">
              <ButtonLink href={project.repo} variant="secondary">
                <GitHubIcon className="size-4" />
                {xrCopy.repoCta}
              </ButtonLink>
            </div>
          </header>
        </Container>
      </div>

      <Container>
        <XrVideo video={project.video} poster={images.overview} />

        <CaseStudySection id="problem" heading={xrCopy.headings.problem}>
          <p className="mt-4 max-w-prose sm:text-lg">{caseStudy.problem}</p>
        </CaseStudySection>

        <CaseStudySection id="trainee-steps" heading={xrCopy.headings.traineeSteps}>
          <ol role="list" className="mt-6 grid gap-5 sm:grid-cols-2">
            {caseStudy.traineeSteps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span aria-hidden="true" className="shrink-0 pt-0.5 font-mono text-sm text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
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
          <ol role="list" className="mt-6 grid gap-6 lg:grid-cols-3">
            {caseStudy.technicalChallenges.map((challenge, index) => {
              const headingId = `challenge-${index + 1}`;
              return (
                <li key={challenge.title}>
                  <article
                    aria-labelledby={headingId}
                    className="h-full rounded-lg border border-border bg-surface p-5 transition-colors duration-200 ease-out hover:border-accent/60 sm:p-6"
                  >
                    <p aria-hidden="true" className="font-mono text-xs text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 id={headingId} className="mt-2 text-lg font-semibold tracking-tight">
                      {challenge.title}
                    </h3>
                    <p className="mt-3 text-sm">{challenge.body}</p>
                  </article>
                </li>
              );
            })}
          </ol>
        </CaseStudySection>

        <CaseStudySection id="outcome" heading={xrCopy.headings.outcome}>
          <p className="mt-4 max-w-prose sm:text-lg">{caseStudy.outcome}</p>
        </CaseStudySection>

        <CaseStudySection id="gallery" heading={xrCopy.headings.gallery}>
          <ul role="list" className="mt-6 grid gap-6 sm:grid-cols-2">
            {images.gallery.map((image) => (
              <li key={image.src}>
                <figure>
                  <div className="aspect-video overflow-hidden rounded-md border border-border bg-bg">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      sizes="(min-width: 1100px) 530px, (min-width: 640px) 50vw, 100vw"
                      className="size-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 text-sm text-text-muted">{image.alt}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </CaseStudySection>

        <CaseStudySection id="credits" heading={xrCopy.headings.credits}>
          <p className="mt-4 max-w-prose">
            {xrCopy.builtWith} {teamLine(project.team)}.
          </p>
          <p className="mt-3 max-w-prose text-sm text-text-muted">{caseStudy.credits.assets}</p>
          <p className="mt-2">
            <a
              href={caseStudy.credits.creditsFile.href}
              className="-mx-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-accent hover:underline hover:underline-offset-4"
            >
              {caseStudy.credits.creditsFile.label}
            </a>
          </p>
        </CaseStudySection>

        <nav
          aria-label={xrCopy.pageNavLabel}
          className="flex flex-wrap justify-between gap-4 border-t border-border py-8"
        >
          <Link href="/#vr-ar"className={textLink}>
            <span aria-hidden="true">←</span>
            {xrCopy.backToSection}
          </Link>
          <Link href="/#experience" className={textLink}>
            {xrCopy.nextSection}
            <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </Container>
    </article>
  );
}
