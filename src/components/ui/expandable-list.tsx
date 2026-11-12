"use client";

import { useId, useState } from "react";
import { cx } from "@/lib/cx";

type ExpandableListProps = {
  items: readonly string[];
  /** Items shown before the button. */
  shown: number;
  /** The button's labels, computed on the server ("Show all 6", "Show fewer"). */
  showAllLabel: string;
  showFewerLabel: string;
  className?: string;
};

/**
 * A bulleted list that shows its first `shown` items and a button that reveals the rest in place.
 * Every item is server-rendered; the extra ones carry `hidden` until expanded.
 */
export function ExpandableList({ items, shown, showAllLabel, showFewerLabel, className }: ExpandableListProps) {
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const collapsible = items.length > shown;

  return (
    <div className={className}>
      <ul id={listId} className="max-w-measure list-disc space-y-1.5 pl-5 text-sm marker:text-accent">
        {items.map((item, index) => (
          <li key={item} hidden={collapsible && !expanded && index >= shown}>
            {item}
          </li>
        ))}
      </ul>
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((value) => !value)}
          className="group -mx-2 mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-accent hover:underline hover:underline-offset-4"
        >
          {expanded ? showFewerLabel : showAllLabel}
          <span
            aria-hidden="true"
            className={cx("transition-transform duration-fast ease-out", expanded && "rotate-180")}
          >
            ↓
          </span>
        </button>
      )}
    </div>
  );
}
