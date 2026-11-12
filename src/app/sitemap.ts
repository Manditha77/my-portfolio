import type { MetadataRoute } from "next";
import { caseStudies, caseStudyHref } from "@/content/case-studies";
import { absoluteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), priority: 1 },
    ...caseStudies.map((project) => ({ url: absoluteUrl(caseStudyHref(project)), priority: 0.8 })),
  ];
}
