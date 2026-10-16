import type { TechnicalChallenge } from "@/content/xr";

type ChallengeCardsProps = {
  challenges: readonly TechnicalChallenge[];
};

/** The technical challenges as numbered cards, three across on large screens. */
export function ChallengeCards({ challenges }: ChallengeCardsProps) {
  return (
    <ol role="list" className="mt-6 grid gap-6 lg:grid-cols-3">
      {challenges.map((challenge, index) => {
        const headingId = `challenge-${index + 1}`;
        return (
          <li key={challenge.title}>
            <article
              aria-labelledby={headingId}
              className="h-full rounded-lg border border-border bg-surface p-5 transition-colors duration-200 ease-out hover:border-accent/60 sm:p-6"
            >
              <p aria-hidden="true" className="font-mono text-xs text-accent">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 id={headingId} className="mt-2 text-lg font-semibold tracking-tight">
                {challenge.title}
              </h3>
              <p className="mt-3 text-sm">{challenge.body}</p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
