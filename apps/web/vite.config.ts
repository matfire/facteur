import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** A page written to exactly `outputPath`, left out of the sitemap. */
const exactFile = (path: string, outputPath = path) => ({
  path,
  sitemap: { exclude: true },
  prerender: { enabled: true, outputPath, autoSubfolderIndex: false },
});

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    contentCollections(),
    tailwindcss(),
    tanstackStart({
      // The site is fully static: every page is rendered at build time, starting
      // from / and following links, so new docs pages are picked up on their own.
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoStaticPathsDiscovery: false,
        failOnError: true,
      },
      pages: [
        { path: "/" },
        exactFile("/llms.txt"),
        exactFile("/llms-full.txt"),
        exactFile("/404", "/404.html"),
      ],
      sitemap: { enabled: true, host: "https://facteur.dev" },
    }),
    react(),
  ],
});
