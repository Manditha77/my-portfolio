import { cx } from "@/lib/cx";

type TagListProps = {
  tags: readonly string[];
  label?: string;
  className?: string;
};

/** Tech tags in the mono font. Wraps, so long tags never overflow at 320px. */
export function TagList({ tags, label, className }: TagListProps) {
  return (
    <ul role="list" aria-label={label} className={cx("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <li key={tag} className="rounded-md border border-border bg-bg px-2 py-1 font-mono text-xs text-text-muted">
          {tag}
        </li>
      ))}
    </ul>
  );
}
