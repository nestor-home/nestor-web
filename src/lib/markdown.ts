/** A docs page as plain Markdown (for language models, src/lib/llms.ts): no Astro, so it can be tested alone. */
import { type Locale, ROUTES } from "@/i18n";
import { BRANDS, type BrandKey, brandOf } from "@/lib/brands";
import { SITE } from "@/lib/site";

/** A page's Markdown address: `/docs/quickstart.md`, `/docs/index.md` for the first one. */
export function markdownHref(locale: Locale, slug: string): string {
  return `${ROUTES.docs[locale]}${slug || "index"}.md`;
}

/** The components whose tags go: wrappers whose content stays, and the diagrams (src/components/docs/diagrams). */
const WITHOUT_WORDS = new Set([
  "Steps",
  "Cards",
  "Providers",
  "ProviderSetup",
  "Tab",
  "Tabs",
  "SystemMap",
  "TurnFlow",
  "PromptLayers",
  "PairingFlow",
  "PairingStates",
  "MemoryTurn",
  "Initiative",
  "HybridSearch",
  "Consolidation",
]);

const attr = (tag: string, name: string) => new RegExp(`${name}=["{]([^"}]*)["}]`).exec(tag)?.[1];
const brandName = (key: string | undefined) => (key && key in BRANDS ? brandOf(key as BrandKey).name : key) ?? "";
const absolute = (markdown: string) => markdown.replace(/\]\((\/[^)\s]*)\)/g, `](${SITE}$1)`);

/** An MDX page's body as plain Markdown: imports dropped, components turned into what they show. */
export function toMarkdown(body: string): string {
  return absolute(
    body
      .replace(/^import .*$/gm, "")
      // a card: a link and its line
      .replace(/<Card\b([^>]*)>([\s\S]*?)<\/Card>/g, (_, tag: string, text: string) => {
        const title = attr(tag, "title") ?? "";
        const href = attr(tag, "href");
        return `- ${href ? `[${title}](${href})` : `**${title}**`}: ${text.trim()}`;
      })
      // a provider's or a tab's setup: a heading with its name
      .replace(
        /<(?:ProviderSetup|Tab)\b([^>]*)>/g,
        (_, tag: string) => `\n### ${brandName(attr(tag, "brand") ?? attr(tag, "choice"))}\n`,
      )
      // a screen of the admin: what it shows, in words
      .replace(/<AdminShot\b([^>]*?)\/>/g, (_, tag: string) => `*${attr(tag, "alt") ?? ""}*`)
      // a callout: a quote
      .replace(/<Callout\b[^>]*>([\s\S]*?)<\/Callout>/g, (_, text: string) =>
        text
          .trim()
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n"),
      )
      // a wrapper keeps its content, a diagram has no words of its own here: their tags go; any other is a
      // component this conversion does not know yet, refused rather than lost
      .replace(/<\/?([A-Z][A-Za-z]*)\b[^>]*?\/?>/g, (_, name: string) => {
        if (!WITHOUT_WORDS.has(name)) throw new Error(`[markdown] no rule for the <${name}> component`);
        return "";
      })
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}
