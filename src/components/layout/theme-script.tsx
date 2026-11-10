import { motionInitScript } from "@/lib/motion-pref";
import { themeInitScript } from "@/lib/theme";

/**
 * Sets data-theme and data-motion on <html> during HTML parsing, before first paint,
 * so there is no theme flash and no animation starts against the user's choice.
 */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: `${themeInitScript};${motionInitScript}` }} />;
}
