import { cx } from "@/lib/cx";

type TagListProps = {
  tags: readonly string[];
  label?: string;
  tone?: "default" | "accent";
  className?: string;
};

const tones = {
  default: "border-border text-text-muted",
  accent: "border-accent/40 text-accent",
} as const;

/** Tech tags in the mono font. Wraps, so long tags never overflow at 320px. */
export function TagList({ tags, label, tone = "default", className }: TagListProps) {
  return (
    <ul role="list" aria-label={label} className={cx("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <li key={tag} className={cx("rounded-md border bg-bg px-2 py-1 font-mono text-xs", tones[tone])}>
          {tag}
        </li>
      ))}
    </ul>
  );
}
