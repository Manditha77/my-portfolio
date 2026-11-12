import { bootInitScript, bootTimingCss } from "@/lib/boot";
import { motionInitScript } from "@/lib/motion-pref";
import { themeInitScript } from "@/lib/theme";

/**
 * Sets data-theme, data-motion and (on a first visit to the home page) data-boot on <html> during HTML
 * parsing, before first paint, so there is no theme flash, no animation starts against the user's choice,
 * and the cube boot's opening state is in place from the first frame. The style holds the boot's timings
 * (src/lib/boot.ts).
 */
export function ThemeScript() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `${themeInitScript};${motionInitScript};${bootInitScript}` }} />
      <style dangerouslySetInnerHTML={{ __html: bootTimingCss }} />
    </>
  );
}
