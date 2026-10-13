"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { buttonBase, buttonVariants } from "./button-link";
import { CheckIcon, CopyIcon } from "./icons";

type CopyEmailButtonProps = {
  email: string;
  label: string;
  copiedLabel: string;
  failedLabel: string;
};

type CopyState = "idle" | "copied" | "failed";

const RESET_MS = 2000;

/** Copies through a hidden textarea, for browsers without the async Clipboard API. */
function legacyCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  try {
    textarea.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }
  return legacyCopy(text);
}

export function CopyEmailButton({ email, label, copiedLabel, failedLabel }: CopyEmailButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function handleClick() {
    window.clearTimeout(timer.current);
    const ok = await copyText(email);
    setState(ok ? "copied" : "failed");
    if (ok) timer.current = window.setTimeout(() => setState("idle"), RESET_MS);
  }

  const copied = state === "copied";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cx(buttonBase, buttonVariants.secondary, "min-w-36")}
      >
        {copied ? <CheckIcon className="text-accent" /> : <CopyIcon />}
        {copied ? copiedLabel : label}
      </button>

      {/* Always mounted so screen readers announce changes to its text. */}
      <p role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : state === "failed" ? failedLabel : ""}
      </p>

      {state === "failed" && (
        <p className="basis-full text-sm text-text-muted">
          {failedLabel}{" "}
          <span className="font-mono break-all text-text select-all">{email}</span>
        </p>
      )}
    </>
  );
}
