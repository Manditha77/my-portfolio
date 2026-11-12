import type { TechnicalChallenge } from "@/content/xr";
import { cardHover } from "@/components/ui/card";
import { ScanFrame } from "@/components/ui/scan-frame";
import { cx } from "@/lib/cx";

type ChallengeCardsProps = {
  challenges: readonly TechnicalChallenge[];
  /** Keeps each card's SCAN id unique across pages (the project slug). */
  idPrefix: string;
};

/** The technical challenges as numbered cards, three across on large screens. Each gets the SCAN frame. */
export function ChallengeCards({ challenges, idPrefix }: ChallengeCardsProps) {
  return (
    <ol role="list" className="mt-6 grid gap-6 lg:grid-cols-3">
      {challenges.map((challenge, index) => {
        const headingId = `challenge-${index + 1}`;
        return (
          <li key={challenge.title}>
            <article
              aria-labelledby={headingId}
              data-scan={`${idPrefix}-challenge-${index + 1}`}
              className={cx("relative h-full rounded-lg border border-border bg-surface p-5 sm:p-6", cardHover)}
            >
              <p aria-hidden="true" className="font-mono text-xs text-accent-ink">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 id={headingId} className="mt-2 text-lg font-semibold tracking-tight">
                {challenge.title}
              </h3>
              <p className="mt-3 max-w-measure text-sm">{challenge.body}</p>

              <ScanFrame />
            </article>
          </li>
        );
      })}
    </ol>
  );
}
