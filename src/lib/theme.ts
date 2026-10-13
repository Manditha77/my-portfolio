export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

export const LIGHT_QUERY = "(prefers-color-scheme: light)";

/**
 * Runs in <head> before first paint. Uses the stored choice if there is one,
 * otherwise the OS preference, and always sets data-theme on <html>.
 */
export const themeInitScript = `(function(){try{var t=null;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia("${LIGHT_QUERY}").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode, disabled site data): the choice lasts for this page only.
  }
}

export function systemTheme(): Theme {
  return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}
