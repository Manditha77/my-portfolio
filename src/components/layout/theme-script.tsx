import { themeInitScript } from "@/lib/theme";

/** Sets data-theme on <html> during HTML parsing, before first paint, so there is no theme flash. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}
