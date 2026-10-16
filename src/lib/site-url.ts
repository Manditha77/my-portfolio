/** The site's public origin. Set NEXT_PUBLIC_SITE_URL in every deploy environment (see .env.example). */
export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}
