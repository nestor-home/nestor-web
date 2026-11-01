/**
 * The site's words, in Project Fluent (the format Nestor itself uses): one `.ftl` file per section
 * and locale under `src/locales/<locale>/`, read at build time. Components never hold a sentence:
 * they ask `t("message-id")`. A missing message fails the build rather than shipping an id.
 */
import { FluentBundle, FluentResource, type FluentVariable } from "@fluent/bundle";

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const SOURCES = import.meta.glob("../locales/*/*.ftl", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

/** The `.ftl` sources of a locale, by file name. */
export function sourcesOf(locale: Locale): Record<string, string> {
  return Object.fromEntries(
    Object.entries(SOURCES)
      .filter(([path]) => path.includes(`/locales/${locale}/`))
      .map(([path, text]) => [path.split("/").pop() ?? path, text]),
  );
}

const bundles = new Map<Locale, FluentBundle>();

export function bundleFor(locale: Locale): FluentBundle {
  const cached = bundles.get(locale);
  if (cached) return cached;
  const bundle = new FluentBundle(locale, { useIsolating: false });
  for (const [file, text] of Object.entries(sourcesOf(locale))) {
    const errors = bundle.addResource(new FluentResource(text));
    if (errors.length) throw new Error(`[i18n] ${locale}/${file}: ${errors.map(String).join("; ")}`);
  }
  bundles.set(locale, bundle);
  return bundle;
}

export type Args = Record<string, FluentVariable>;

export interface Translator {
  locale: Locale;
  /** A message (or `message.attribute`) as plain text. */
  (id: string, args?: Args): string;
  /** A message as HTML: escaped, then `*emphasis*`, `**strong**` and `` `code` `` become markup. */
  html: (id: string, args?: Args) => string;
  /** Whether the message exists (for optional lines in a list). */
  has: (id: string) => boolean;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function markup(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function translator(locale: Locale): Translator {
  const bundle = bundleFor(locale);
  const format = (id: string, args?: Args): string => {
    const [name, attribute] = id.split(".") as [string, string | undefined];
    const message = bundle.getMessage(name);
    const pattern = attribute ? message?.attributes[attribute] : message?.value;
    if (!pattern) throw new Error(`[i18n] missing message "${id}" in ${locale}`);
    const errors: Error[] = [];
    const text = bundle.formatPattern(pattern, args ?? null, errors);
    if (errors.length) throw new Error(`[i18n] ${locale} "${id}": ${errors.map(String).join("; ")}`);
    return text;
  };
  const t = format as Translator;
  t.locale = locale;
  t.html = (id, args) => markup(format(id, args));
  t.has = (id) => {
    const [name, attribute] = id.split(".") as [string, string | undefined];
    const message = bundle.getMessage(name);
    return Boolean(attribute ? message?.attributes[attribute] : message?.value);
  };
  return t;
}

/** The site's pages and their address in each language (English at the root, French under `/fr/`). */
export const ROUTES = {
  home: { en: "/", fr: "/fr/" },
  developers: { en: "/developers/", fr: "/fr/developpeurs/" },
  docs: { en: "/docs/", fr: "/fr/docs/" },
} as const satisfies Record<string, Record<Locale, string>>;
export type Page = keyof typeof ROUTES;

export function href(locale: Locale, page: Page, hash = ""): string {
  return `${ROUTES[page][locale]}${hash ? `#${hash}` : ""}`;
}

/** What the layout needs to know about a page of ROUTES: its addresses, title, description and card. */
export function pageMeta(t: Translator, page: Page) {
  return {
    alternates: ROUTES[page],
    title: t(`meta-title-${page}`),
    description: t(`meta-description-${page}`),
    card: page,
  };
}

/** A path in a locale for pages outside ROUTES (the 404). */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
}
