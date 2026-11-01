/**
 * The developer documentation: its pages, in reading order, grouped as the sidebar shows them.
 * Each page is a Markdown file per locale, `src/content/docs/<locale>/<slug>.md` (`index.md` for the
 * first one), served at `/docs/<slug>/` and `/fr/docs/<slug>/`.
 */
import { type Locale, ROUTES } from "@/i18n";

/** Groups of the sidebar; their names are the Fluent messages `docs-group-<id>`. */
export const DOC_GROUPS = [
  { id: "start", pages: [""] },
  { id: "satellites", pages: ["satellites", "satellites/protocol", "satellites/schemas", "satellites/conformance"] },
  { id: "sdks", pages: ["sdks/python", "sdks/typescript", "sdks/rust", "sdks/templates"] },
  { id: "project", pages: ["contributing"] },
] as const;

export type DocSlug = (typeof DOC_GROUPS)[number]["pages"][number];

/** Every page, in reading order. */
export const DOC_SLUGS: readonly DocSlug[] = DOC_GROUPS.flatMap((group) => group.pages);

/** A page's address in a locale. */
export function docHref(locale: Locale, slug: string): string {
  return `${ROUTES.docs[locale]}${slug ? `${slug}/` : ""}`;
}

/** A content entry's id (`fr/sdks/rust`, `en/index`) as its locale and slug. */
export function parseDocId(id: string): { locale: string; slug: string } {
  const [locale = "", ...rest] = id.split("/");
  const slug = rest.join("/");
  return { locale, slug: slug === "index" ? "" : slug };
}

/** The pages before and after one, for the links at the bottom of a page. */
export function neighbours(slug: string): { previous?: DocSlug; next?: DocSlug } {
  const index = DOC_SLUGS.indexOf(slug as DocSlug);
  if (index < 0) return {};
  const previous = DOC_SLUGS[index - 1];
  const next = DOC_SLUGS[index + 1];
  return { ...(previous !== undefined ? { previous } : {}), ...(next !== undefined ? { next } : {}) };
}

/** The first fenced code block of a language in a Markdown text (a page's minimal example). */
export function firstCodeBlock(markdown: string, lang: string): string | undefined {
  const fence = new RegExp(`^\`\`\`${lang}[^\\n]*\\n([\\s\\S]*?)^\`\`\``, "m");
  return fence.exec(markdown)?.[1];
}
