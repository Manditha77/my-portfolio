import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type IconLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "aria-label" | "children"> & {
  href: string;
  /** Accessible name; the link has no visible text. */
  label: string;
  children: ReactNode;
};

export function IconLink({ label, className, children, ...rest }: IconLinkProps) {
  return (
    <a
      aria-label={label}
      className={cx(
        "inline-flex size-11 items-center justify-center rounded-md text-text-muted transition-colors duration-150 ease-out hover:text-accent",
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
