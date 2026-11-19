/**
 * What search engines read beside the page (schema.org, as JSON-LD): the site and the software on the home page; on a
 * page of the docs, the article and where it sits. Every word comes from the page itself or the Fluent catalogues.
 */
import { href, type Locale } from "@/i18n";
import { DOC_GROUPS, docHref } from "@/lib/docs";
import { ORG, REPOS, SITE } from "@/lib/site";

const WEBSITE = `${SITE}/#website`;
const absolute = (path: string) => new URL(path, SITE).href;

type Thing = Record<string, unknown>;

const website = (name: string): Thing => ({
  "@type": "WebSite",
  "@id": WEBSITE,
  name,
  url: `${SITE}/`,
  inLanguage: ["en", "fr"],
});

/** The home page: the site, and Nestor as free software one installs. */
export function homeGraph(locale: Locale, description: string): Thing {
  return {
    "@context": "https://schema.org",
    "@graph": [
      website("Nestor"),
      {
        "@type": "SoftwareApplication",
        name: "Nestor",
        description,
        url: absolute(href(locale, "home")),
        applicationCategory: "HomeApplication",
        operatingSystem: "Linux, macOS",
        license: "https://opensource.org/licenses/MIT",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        downloadUrl: "https://pypi.org/project/nestor-home/",
        sameAs: [ORG, REPOS.nestor],
      },
    ],
  };
}

/** A page of the docs: the article, and the trail from the docs to it through its group. */
export function docGraph(
  locale: Locale,
  page: { slug: string; title: string; description: string },
  names: { docs: string; group: (id: string) => string },
): Thing {
  const url = absolute(docHref(locale, page.slug));
  const group = DOC_GROUPS.find((g) => (g.pages as readonly string[]).includes(page.slug));
  const root = absolute(docHref(locale, ""));
  // the group's step leads to its first page; left out when that is the docs' root or the page itself
  const first = group ? absolute(docHref(locale, group.pages[0])) : root;
  const trail = [
    { name: names.docs, url: root },
    ...(first !== root && first !== url && group ? [{ name: names.group(group.id), url: first }] : []),
    ...(url !== root ? [{ name: page.title, url }] : []),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      website("Nestor"),
      {
        "@type": "TechArticle",
        headline: page.title,
        description: page.description,
        inLanguage: locale,
        url,
        isPartOf: { "@id": WEBSITE },
        about: { "@type": "SoftwareApplication", name: "Nestor" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: trail.map((step, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: step.name,
          item: step.url,
        })),
      },
    ],
  };
}
