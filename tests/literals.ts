/** The visible text an Astro or JSX source writes as literals (see no-literals.test.ts). */
/** Words that are names or symbols, not sentences. */
const ALLOWED = new Set(["nestor", "n"]);

export function literals(source: string): string[] {
  const markup = source
    .replace(/^---[\s\S]*?\n---/, "") // Astro frontmatter
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  // expressions, innermost first, until none is left (JSX inside them goes too)
  let stripped = markup;
  for (let previous = ""; previous !== stripped; ) {
    previous = stripped;
    stripped = stripped.replace(/\{[^{}]*\}/g, "");
  }
  const found: string[] = [];
  for (const match of stripped.matchAll(/>([^<>{}]*)</g)) {
    const text = (match[1] ?? "").trim();
    if (/\p{L}{2,}/u.test(text) && !ALLOWED.has(text)) found.push(text);
  }
  for (const match of stripped.matchAll(/\b(?:alt|aria-label|title|placeholder)="([^"]*\p{L}[^"]*)"/gu)) {
    found.push(match[1] ?? "");
  }
  return found;
}
