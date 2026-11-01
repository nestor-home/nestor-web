/** The developer documentation, one Markdown file per page and locale (see src/lib/docs.ts); MDX where a page holds a component. */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const docs = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/docs",
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { docs };
