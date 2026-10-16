import type { Metadata } from "next";
import { site } from "@/content/site";

/**
 * Shared Open Graph fields. Next replaces a parent's whole `openGraph` object when a route sets
 * its own, so routes that override it spread this in.
 */
export const baseOpenGraph = {
  type: "website",
  siteName: site.name,
  locale: "en_GB",
} satisfies NonNullable<Metadata["openGraph"]>;
