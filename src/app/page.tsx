import type { Metadata } from "next";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Skills } from "@/components/sections/skills";
import { Work } from "@/components/sections/work";
import { Writing } from "@/components/sections/writing";
import { XrSpotlight } from "@/components/sections/xr-spotlight";
import { personJsonLd, serializeJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd()) }}
      />
      <Hero />
      <Work />
      <XrSpotlight />
      <Experience />
      <Writing />
      <Skills />
      <About />
      <Contact />
    </>
  );
}
