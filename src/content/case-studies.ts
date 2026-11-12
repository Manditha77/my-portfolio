import { ppchFramework, workCopy } from "./projects";
import type { ExternalLink } from "./types";
import { caseStudyHref, xrCopy, xrProjects } from "./xr";

/** A case study page's place in the site: previous/next order and its links back into the home page. */
export type CaseStudyEntry = {
  slug: string;
  title: string;
  /** The home section the project belongs to. */
  backTo: ExternalLink;
  /** The home section after it. */
  next: ExternalLink;
};

const fromWork = {
  backTo: { label: workCopy.backToSection, href: "/#work" },
  next: { label: workCopy.nextSection, href: "/#vr-ar" },
};

const fromXr = {
  backTo: { label: xrCopy.backToSection, href: "/#vr-ar" },
  next: { label: xrCopy.nextSection, href: "/#experience" },
};

/** Every case study, in home page order. The pager and the sitemap follow it. */
export const caseStudies: readonly CaseStudyEntry[] = [
  { slug: ppchFramework.slug, title: ppchFramework.title, ...fromWork },
  ...xrProjects.map((project) => ({ slug: project.slug, title: project.title, ...fromXr })),
];

export { caseStudyHref };
