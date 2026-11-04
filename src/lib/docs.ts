/**
 * The developer documentation: its pages, in reading order, grouped as the sidebar shows them.
 * Each page is a Markdown file per locale, `src/content/docs/<locale>/<slug>.md` (`index.md` for the
 * first one), served at `/docs/<slug>/` and `/fr/docs/<slug>/`.
 */
import { type Locale, ROUTES } from "@/i18n";
import type { BrandKey } from "@/lib/brands";

/** Groups of the sidebar; their names are the Fluent messages `docs-group-<id>`. */
export const DOC_GROUPS = [
  { id: "start", pages: ["", "quickstart", "install"] },
  { id: "agent", pages: ["agent", "agent/memory", "agent/initiative"] },
  { id: "configure", pages: ["configuration", "models", "channels", "connections", "updates"] },
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

/** The tabs a page shows (`<Tabs set>` and its `<Tab>`s): each set's choices, the first shown before one is made.
 * Their names are the brands' own; the list's label is the Fluent message `tabs-<set>`. */
export const TAB_SETS = {
  install: ["uv", "pip", "docker"],
} as const satisfies Record<string, readonly BrandKey[]>;

export type TabSet = keyof typeof TAB_SETS;

/** A choice's tab id (`install-docker`, `model-ollama`), which is also the address that opens it; its
 * panel (ChoicePanel.astro) is `<id>-panel`. */
export const choiceId = (group: string, choice: string): string => `${group}-${choice}`;

/**
 * The commands of every `bash` block a page tags (` ```bash quickstart `), comments and blank lines
 * dropped: the home page shows the documentation's own commands, wherever the page moves them.
 */
export function taggedCommands(markdown: string, tag: string): string[][] {
  return [...markdown.matchAll(/^```bash ([^\n]*)\n([\s\S]*?)^```/gm)]
    .filter((m) => (m[1] ?? "").split(" ").includes(tag))
    .map((m) =>
      (m[2] ?? "")
        .split("\n")
        .map((line) => line.replace(/(^|\s+)#.*$/, "").trim())
        .filter(Boolean),
    );
}
