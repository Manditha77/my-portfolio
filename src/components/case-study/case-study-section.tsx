import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";
import { cx } from "@/lib/cx";

type CaseStudySectionProps = {
  id: string;
  heading: string;
  /** The main sections (My role, Technical challenges) get an accent rule and more weight. */
  prominent?: boolean;
  children: ReactNode;
  className?: string;
};

/** A titled block on a case study page: an h2 under the page's h1, revealed once. */
export function CaseStudySection({ id, heading, prominent = false, children, className }: CaseStudySectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={cx("py-section", className)}>
      <Reveal>
        <h2
          id={headingId}
          className={cx(
            "font-semibold tracking-tight",
            prominent ? "border-l-2 border-accent pl-4 text-h2" : "text-xl sm:text-2xl",
          )}
        >
          {heading}
        </h2>
        {children}
      </Reveal>
    </section>
  );
}
