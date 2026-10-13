import type { AnchorHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "secondary";
};

const variants = {
  primary: "bg-accent text-accent-contrast hover:opacity-90",
  secondary: "border border-border text-text hover:border-accent hover:text-accent",
} as const;

export function ButtonLink({ variant = "primary", className, children, ...rest }: ButtonLinkProps) {
  return (
    <a
      className={cx(
        "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
