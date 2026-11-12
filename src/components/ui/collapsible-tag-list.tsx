"use client";

import { useId, useState } from "react";
import { shellCopy } from "@/content/navigation";
import { cx } from "@/lib/cx";
import { TagList, tagClass, type TagTone } from "./tag";

type CollapsibleTagListProps = {
  tags: readonly string[];
  label?: string;
  tone?: TagTone;
  className?: string;
  /** Tags shown before the "+N more" button. */
  limit?: number;
};

/**
 * Tag list for cards: shows the first `limit` tags and a "+N more" button that reveals the rest in place.
 * The hidden tags stay in the DOM (with `hidden`), so the list is complete once expanded.
 */
export function CollapsibleTagList({ tags, label, tone = "default", className, limit = 6 }: CollapsibleTagListProps) {
  const listId = useId();
  const [expanded, setExpanded] = useState(false);

  if (tags.length <= limit) return <TagList tags={tags} label={label} tone={tone} className={className} />;

  const hiddenCount = tags.length - limit;

  return (
    <div className={cx("flex flex-wrap gap-2", className)}>
      {/* display: contents lets the tags and the button wrap together; role="list" keeps list semantics. */}
      <ul id={listId} role="list" aria-label={label} className="contents">
        {tags.map((tag, index) => (
          <li key={tag} hidden={!expanded && index >= limit} className={tagClass(tone)}>
            {tag}
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((value) => !value)}
        className="rounded-md border border-dashed border-border px-2 py-1 font-mono text-xs text-text-muted transition-colors duration-fast ease-out hover:border-accent hover:text-accent-ink"
      >
        {expanded ? (
          shellCopy.tagsShowLess
        ) : (
          <>
            <span aria-hidden="true">{shellCopy.tagsMore(hiddenCount)}</span>
            <span className="sr-only">{shellCopy.tagsShowMore(hiddenCount)}</span>
          </>
        )}
      </button>
    </div>
  );
}
