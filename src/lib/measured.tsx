import type { ReactNode } from "react";
import { CountUp } from "@/components/ui/count-up";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps each listed measured value in `text` with <CountUp>. Values come from the content files
 * (e.g. a project's `countUp`), so only numbers chosen there animate. A match must stand alone:
 * not part of a longer number ("100" never matches inside "1,000" or "100.5").
 */
export function withCountUp(text: string, values?: readonly string[]): ReactNode {
  if (!values || values.length === 0) return text;

  // Not preceded by a digit, "1." or "1,"; not followed by a digit, ".5" or ",000". Punctuation after is fine.
  const pattern = new RegExp(`(?<!\\d|\\d[.,])(${values.map(escapeRegExp).join("|")})(?!\\d|[.,]\\d)`, "g");
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    parts.push(<CountUp key={index} value={match[0]} />);
    lastIndex = index + match[0].length;
  }
  if (lastIndex === 0) return text;
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
