import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type StatusPillProps = {
  children: ReactNode;
  className?: string;
};

export function StatusPill({ children, className }: StatusPillProps) {
  return (
    <p
      className={cx(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-text",
        className,
      )}
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />
      {children}
    </p>
  );
}
