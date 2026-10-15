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
  /** Old anchor ids that should still land on this section, rendered as empty targets at its top. */
  anchorAliases?: readonly string[];
  children?: ReactNode;
};

/**
 * A home page section with an h2 taken from the navigation content, labelled for assistive tech.
 * Owns the vertical rhythm (py-section) and the one-time reveal, so sections never set their own.
 */
export function Section({ id, heading, anchorAliases, children, className, ...rest }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={cx("py-section", className)} {...rest}>
      {/* Outside Reveal so the target sits at the section top, unaffected by the reveal transform. */}
      {anchorAliases?.map((alias) => (
        <span key={alias} id={alias} aria-hidden="true" className="block" />
      ))}
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
