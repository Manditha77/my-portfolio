import Image from "next/image";
import { about } from "@/content/about";
import { site } from "@/content/site";
import { Section } from "@/components/ui/section";
import { publicFileExists } from "@/lib/public-file";

const linkClass =
  "inline-flex min-h-11 items-center font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors duration-150 hover:decoration-accent";

export function About() {
  const hasPhoto = publicFileExists(about.photo.src);

  return (
    <Section id="about">
      <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
        {hasPhoto && (
          <div className="relative aspect-[4/5] w-40 shrink-0 overflow-hidden rounded-lg border border-border md:w-56">
            <Image
              src={about.photo.src}
              alt={about.photo.alt}
              fill
              sizes="(min-width: 768px) 224px, 160px"
              className="object-cover"
            />
          </div>
        )}

        <div className="max-w-[65ch]">
          <div className="space-y-4">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <a href={site.cvHref} download className={linkClass}>
              {about.links.downloadCv}
            </a>
            <a href="#contact" className={linkClass}>
              {about.links.getInTouch}
            </a>
          </p>
        </div>
      </div>
    </Section>
  );
}
