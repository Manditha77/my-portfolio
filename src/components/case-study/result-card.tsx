import type { ReactNode } from "react";
import { cardHover } from "@/components/ui/card";
import { ScanFrame } from "@/components/ui/scan-frame";
import { cx } from "@/lib/cx";

type ResultCardProps = {
  /** Unique on the page; also the card's SCAN id. */
  id: string;
  heading: string;
  children: ReactNode;
};

/** One block of a case study's results, styled like the challenge cards, with the SCAN frame. */
export function ResultCard({ id, heading, children }: ResultCardProps) {
  const headingId = `${id}-heading`;
  return (
    <article
      aria-labelledby={headingId}
      data-scan={id}
      className={cx("relative h-full rounded-lg border border-border bg-surface p-5 sm:p-6", cardHover)}
    >
      <h3 id={headingId} className="text-lg font-semibold tracking-tight">
        {heading}
      </h3>
      {children}
      <ScanFrame />
    </article>
  );
}
