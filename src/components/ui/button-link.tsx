import type { AnchorHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "secondary";
};

/** Shared with <button> elements that should look like ButtonLink. */
export const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-[color,background-color,border-color,opacity,transform] duration-150 ease-out motion-safe:active:translate-y-px";

export const buttonVariants = {
  primary: "bg-accent text-accent-contrast hover:opacity-90",
  secondary: "border border-border text-text hover:border-accent hover:text-accent",
} as const;

export function ButtonLink({ variant = "primary", className, children, ...rest }: ButtonLinkProps) {
  return (
    <a
      className={cx(buttonBase, buttonVariants[variant], className)}
      {...rest}
    >
      {children}
    </a>
  );
}
