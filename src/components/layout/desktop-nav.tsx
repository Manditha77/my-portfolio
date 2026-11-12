"use client";

import Link from "next/link";
import type { NavItem } from "@/content/navigation";
import { shellCopy } from "@/content/navigation";
import { useActiveSection } from "@/lib/use-active-section";

type DesktopNavProps = {
  items: NavItem[];
};

/** The header's inline nav (md and up). Marks the section in view with aria-current. */
export function DesktopNav({ items }: DesktopNavProps) {
  const active = useActiveSection();

  return (
    <nav aria-label={shellCopy.primaryNavLabel} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.id === active ? "true" : undefined}
              className="relative inline-flex min-h-11 items-center rounded-md px-3 text-sm text-text-muted transition-colors duration-fast ease-out after:absolute after:inset-x-3 after:bottom-2 after:h-0.5 after:rounded-full after:bg-accent after:opacity-0 after:transition-opacity after:duration-fast hover:text-text aria-current:text-text aria-current:after:opacity-100"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
