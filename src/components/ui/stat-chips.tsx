import { cx } from "@/lib/cx";
import { withCountUp } from "@/lib/measured";

type StatChipsProps = {
  chips: readonly string[];
  /** Values in the chips that count up once on view (PIPELINE), from the content file. */
  countUp?: readonly string[];
  label?: string;
  className?: string;
};

/** A card's short measured stats ("334 PRs", "0.78 AUC"): like the accent tags, a step larger. */
export function StatChips({ chips, countUp, label, className }: StatChipsProps) {
  return (
    <ul role="list" aria-label={label} className={cx("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <li key={chip} className="rounded-md border border-accent/40 bg-bg px-2.5 py-1 font-mono text-sm text-accent">
          {withCountUp(chip, countUp)}
        </li>
      ))}
    </ul>
  );
}
