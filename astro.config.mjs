import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { protocolSchemas } from "./scripts/schemas.mjs";

/** The production origin; GitHub Pages serves the site at the root of this domain. */
export const SITE = "https://nestor.mathislambert.fr";

export default defineConfig({
  site: SITE,
  output: "static",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "auto" },
  integrations: [
    protocolSchemas(),
    react(),
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
