import type { MetadataRoute } from "next";
import { caseStudyHref, xrProjects } from "@/content/xr";
import { absoluteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), priority: 1 },
    ...xrProjects.map((project) => ({ url: absoluteUrl(caseStudyHref(project)), priority: 0.8 })),
  ];
}
