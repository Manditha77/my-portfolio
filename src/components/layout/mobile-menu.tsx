"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { NavItem } from "@/content/navigation";
import { shellCopy } from "@/content/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

type MobileMenuProps = {
  items: NavItem[];
  cvHref: string;
};

/** Disclosure-style menu for small screens. Not a modal, so focus is not trapped. */
export function MobileMenu({ items, cvHref }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 48rem)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? shellCopy.closeMenu : shellCopy.openMenu}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 items-center justify-center rounded-md text-text transition-colors hover:text-accent"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      <div
        id={panelId}
        className={cx(
          "absolute inset-x-0 top-full border-b border-border bg-bg transition-[opacity,transform,visibility] duration-200 ease-out",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <nav aria-label={shellCopy.primaryNavLabel} className="px-4 pt-2 pb-4">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="flex min-h-11 items-center border-b border-border text-base text-text transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href={cvHref} download variant="secondary" onClick={close} className="mt-4 w-full">
            {shellCopy.cv}
          </ButtonLink>
        </nav>
      </div>
    </>
  );
}
