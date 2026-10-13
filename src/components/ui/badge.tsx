import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type BadgeProps = {
  children: ReactNode;
  variant?: "default" | "accent";
  className?: string;
};

const variants = {
  default: "border-border text-text-muted",
  accent: "border-accent text-accent",
} as const;

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
