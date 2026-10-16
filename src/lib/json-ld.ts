import { education } from "@/content/experience";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/site-url";

/** schema.org Person for the home page. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.role,
    alumniOf: education.map((entry) => ({
      "@type": "CollegeOrUniversity",
      name: entry.institution,
    })),
    url: siteUrl.toString(),
    sameAs: [site.links.github.href, site.links.linkedin.href, site.links.medium.href],
  };
}

/** Serialises JSON-LD for a <script> tag, escaping `<` so the content can't close the tag. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
