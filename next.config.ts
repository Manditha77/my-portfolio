import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The short CV link (CLAUDE.md §4). Temporary, so a renamed PDF never sticks in caches.
  async redirects() {
    return [{ source: "/cv.pdf", destination: "/Manditha-Madushanka-CV.pdf", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
