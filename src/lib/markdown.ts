/** A docs page as plain Markdown (for language models, src/lib/llms.ts): no Astro, so it can be tested alone. */
import { type Locale, ROUTES } from "@/i18n";
import { BRANDS, type Brand } from "@/lib/brands";

export const SITE = "https://nestorhome.dev";

/** A page's Markdown address: `/docs/quickstart.md`, `/docs/index.md` for the first one. */
export function markdownHref(locale: Locale, slug: string): string {
  return `${ROUTES.docs[locale]}${slug || "index"}.md`;
}

const attr = (tag: string, name: string) => new RegExp(`${name}=["{]([^"}]*)["}]`).exec(tag)?.[1];
const brandName = (key: string | undefined) => (key && (BRANDS as Record<string, Brand>)[key]?.name) || key || "";
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
      // every other component: its content stays, its tags go (diagrams have none)
      .replace(/<\/?[A-Z][A-Za-z]*\b[^>]*?\/?>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}
