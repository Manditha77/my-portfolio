import type { HTMLAttributes, ReactNode } from "react";
import type { SectionId } from "@/content/navigation";
import { sectionLabel } from "@/content/navigation";
import { cx } from "@/lib/cx";
import { Container } from "./container";

type SectionProps = Omit<HTMLAttributes<HTMLElement>, "id"> & {
  id: SectionId;
  /** Less vertical padding, for small strips such as Writing. */
  compact?: boolean;
  children?: ReactNode;
};

/** A home page section with an h2 taken from the navigation content, labelled for assistive tech. */
export function Section({ id, compact = false, children, className, ...rest }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cx(compact ? "py-12 sm:py-16" : "py-16 sm:py-24", className)}
      {...rest}
    >
      <Container>
        <h2 id={headingId} className="text-h2 font-semibold tracking-tight">
          {sectionLabel(id)}
        </h2>
        {children}
      </Container>
    </section>
  );
}
