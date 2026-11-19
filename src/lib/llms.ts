/**
 * The docs for language models (llmstxt.org): each page as plain Markdown, an index (`/llms.txt`) and the whole
 * set in one file (`/llms-full.txt`), per locale. The pages are the same Markdown the site renders: their imports
 * and components are turned into Markdown here, so nothing is written twice.
 */
import { getCollection } from "astro:content";
import { type Locale, translator } from "@/i18n";
import { DOC_GROUPS, docHref, parseDocId } from "@/lib/docs";
import { markdownHref, SITE, toMarkdown } from "@/lib/markdown";

/** The pages of a locale, in reading order, with their title, description and Markdown. */
export async function pages(locale: Locale) {
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
export function pageDocument(
  locale: Locale,
  page: { slug: string; title: string; description: string; markdown: string },
) {
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
  lines.push(`- [${t("llms-full")}](${SITE}${locale === "en" ? "" : "/fr"}/llms-full.txt): ${t("llms-full-text")}`);
  lines.push(`- [${t("llms-other")}](${SITE}${other === "en" ? "" : "/fr"}/llms.txt)`);
  return `${lines.join("\n")}\n`;
}

/** `/llms-full.txt`: every page, whole, in reading order. */
export async function full(locale: Locale): Promise<string> {
  const groups = await pages(locale);
  return groups.flatMap((g) => g.pages.map((page) => pageDocument(locale, page))).join("\n---\n\n");
}

export const TEXT = { "Content-Type": "text/plain; charset=utf-8" };
export const MARKDOWN = { "Content-Type": "text/markdown; charset=utf-8" };
