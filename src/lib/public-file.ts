import { existsSync } from "node:fs";
import path from "node:path";

/** Whether a file exists under public/. Server-only; evaluated at build time for static pages. */
export function publicFileExists(publicPath: string): boolean {
  return existsSync(path.join(process.cwd(), "public", publicPath));
}
