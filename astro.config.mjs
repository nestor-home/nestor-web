import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { serverFiles } from "./scripts/server.mjs";

/** The production origin: the site is served at the root of this domain. */
export const SITE = "https://nestorhome.dev";

export default defineConfig({
  site: SITE,
  output: "static",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "auto" },
  integrations: [
    serverFiles(),
    react(),
    mdx(), // documentation pages that hold a component (the providers' picker)
    sitemap({
      i18n: { defaultLocale: "en", locales: { en: "en", fr: "fr" } },
    }),
  ],
  image: { responsiveStyles: false },
  // the docs' code takes the identity's colours through CSS variables (.doc-prose in global.css)
  markdown: { shikiConfig: { theme: "css-variables" } },
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
