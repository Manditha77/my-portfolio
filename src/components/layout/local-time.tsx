"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/content/site";

/*
 * "Colombo · 7:38 PM": the local time where I am, updated on each minute boundary. The time only
 * exists in the browser (the page is static), so the server renders an empty line of the same height
 * and nothing shifts when it fills in. Not an animation, so it ignores the Motion switch.
 */

const { city, timeZone, srLabel } = site.footer.localTime;
const MINUTE_MS = 60_000;

const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });

/** The current minute as a number: a stable snapshot until the minute changes. */
function currentMinute(): number {
  return Math.floor(Date.now() / MINUTE_MS);
}

/** Notifies on every minute boundary while the tab is visible, and again when it becomes visible. */
function subscribeMinute(onChange: () => void): () => void {
  let timer: number | undefined;

  const schedule = () => {
    window.clearTimeout(timer);
    if (document.hidden) return;
    timer = window.setTimeout(
      () => {
        onChange();
        schedule();
      },
      MINUTE_MS - (Date.now() % MINUTE_MS) + 50,
    );
  };
  const onVisibility = () => {
    onChange();
    schedule();
  };

  schedule();
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

export function LocalTime() {
  const minute = useSyncExternalStore(subscribeMinute, currentMinute, () => null);

  return (
    <p className="min-h-[1lh]">
      {minute !== null && (
        <>
          <span className="sr-only">{srLabel} </span>
          {city} · <time dateTime={new Date(minute * MINUTE_MS).toISOString()}>{formatter.format(minute * MINUTE_MS)}</time>
        </>
      )}
    </p>
  );
}
