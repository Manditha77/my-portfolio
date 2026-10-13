import type { HTMLAttributes, ReactNode } from "react";
import type { SectionId } from "@/content/navigation";
import { sectionLabel } from "@/content/navigation";
import { cx } from "@/lib/cx";
import { Container } from "./container";
import { Reveal } from "./reveal";

type SectionProps = Omit<HTMLAttributes<HTMLElement>, "id"> & {
  id: SectionId;
  /** Overrides the h2 text; defaults to the section's navigation label. */
  heading?: string;
  children?: ReactNode;
};

/**
 * A home page section with an h2 taken from the navigation content, labelled for assistive tech.
 * Owns the vertical rhythm (py-section) and the one-time reveal, so sections never set their own.
 */
export function Section({ id, heading, children, className, ...rest }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={cx("py-section", className)} {...rest}>
      <Container>
        <Reveal>
          <h2 id={headingId} className="text-h2 font-semibold tracking-tight">
            {heading ?? sectionLabel(id)}
          </h2>
          {children}
        </Reveal>
      </Container>
    </section>
  );
}
