import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type PhoneFrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A phone-shaped frame for portrait screenshots (720×1600, so 9:20). The bezel is padding, not a
 * border, so the screen keeps the exact 9:20 ratio and object-cover never crops or distorts.
 */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className={cx("rounded-[1.75rem] border border-border bg-surface p-1.5 shadow-sm", className)}>
      <div className="relative aspect-[9/20] overflow-hidden rounded-[1.375rem] bg-bg">{children}</div>
    </div>
  );
}
