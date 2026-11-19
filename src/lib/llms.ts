/**
 * The docs for language models (llmstxt.org): each page as plain Markdown, an index (`/llms.txt`) and the whole
 * set in one file (`/llms-full.txt`), per locale. The pages are the same Markdown the site renders: their imports
 * and components are turned into Markdown here, so nothing is written twice.
 */

import { getCollection } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";
import { href, type Locale, translator } from "@/i18n";
import { DOC_GROUPS, docHref, parseDocId } from "@/lib/docs";
import { markdownHref, toMarkdown } from "@/lib/markdown";
import { SITE } from "@/lib/site";

/** The pages of a locale, in reading order, with their title, description and Markdown. */
export async function pages(locale: Locale): Promise<{ group: string; pages: DocPage[] }[]> {
  const entries = await getCollection("docs", (entry) => parseDocId(entry.id).locale === locale);
  return DOC_GROUPS.map((group) => ({
    group: group.id,
    pages: group.pages.flatMap((slug) => {
      const entry = entries.find((e) => parseDocId(e.id).slug === slug);
      return entry
        ? [
            {
              slug,
              title: entry.data.title,
              description: entry.data.description,
              markdown: toMarkdown(entry.body ?? ""),
            },
          ]
        : [];
    }),
  }));
}

/** One page as a Markdown document: its title, its description, its address, then its text. */
/** One page of the docs, ready to be served as Markdown. */
export interface DocPage {
  slug: string;
  title: string;
  description: string;
  markdown: string;
}

export function pageDocument(locale: Locale, page: DocPage) {
  return `# ${page.title}\n\n> ${page.description}\n\nSource: ${SITE}${docHref(locale, page.slug)}\n\n${page.markdown}\n`;
}

/** `/llms.txt`: what Nestor is, then every page by group, each a link to its Markdown and what it holds. */
export async function index(locale: Locale): Promise<string> {
  const t = translator(locale);
  const groups = await pages(locale);
  const other: Locale = locale === "en" ? "fr" : "en";
  const lines = [`# Nestor`, "", `> ${t("llms-summary")}`, "", t("llms-about"), ""];
  for (const { group, pages: list } of groups) {
    lines.push(`## ${t(`docs-group-${group}`)}`, "");
    for (const page of list)
      lines.push(`- [${page.title}](${SITE}${markdownHref(locale, page.slug)}): ${page.description}`);
    lines.push("");
  }
  lines.push(`## ${t("llms-optional")}`, "");
  lines.push(`- [${t("llms-full")}](${SITE}${href(locale, "home")}llms-full.txt): ${t("llms-full-text")}`);
  lines.push(`- [${t("llms-other")}](${SITE}${href(other, "home")}llms.txt)`);
  return `${lines.join("\n")}\n`;
}

/** The routes of each page as Markdown in a locale: `/docs/<slug>.md`, `/docs/index.md` for the first. */
export function markdownRoutes(locale: Locale): { paths: GetStaticPaths; serve: APIRoute } {
  return {
    paths: async () =>
      (await pages(locale))
        .flatMap((g) => g.pages)
        .map((page) => ({ params: { page: page.slug || "index" }, props: { page } })),
    serve: ({ props }) => new Response(pageDocument(locale, props.page as DocPage), { headers: MARKDOWN }),
  };
}

/** `/llms-full.txt`: every page, whole, in reading order. */
export async function full(locale: Locale): Promise<string> {
  const groups = await pages(locale);
  return groups.flatMap((g) => g.pages.map((page) => pageDocument(locale, page))).join("\n---\n\n");
}

export const TEXT = { "Content-Type": "text/plain; charset=utf-8" };
export const MARKDOWN = { "Content-Type": "text/markdown; charset=utf-8" };
