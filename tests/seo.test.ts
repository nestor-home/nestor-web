/** What search engines read: descriptions a result shows whole, and the data beside the page (schema.org). */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES, translator } from "@/i18n";
import { DOC_SLUGS } from "@/lib/docs";
import { docGraph, homeGraph } from "@/lib/seo";

const frontmatter = (locale: string, slug: string) => {
  const base = `src/content/docs/${locale}/${slug || "index"}`;
  for (const ext of [".md", ".mdx"]) {
    try {
      return readFileSync(base + ext, "utf8").split("---")[1] ?? "";
    } catch {}
  }
  throw new Error(`no page ${base}`);
};

describe("search results", () => {
  it("show every description whole: between 50 and 160 characters", () => {
    for (const locale of LOCALES) {
      const descriptions = [
        ["home", translator(locale)("meta-description-home")],
        ...DOC_SLUGS.map((slug) => [slug, /^description: (.*)$/m.exec(frontmatter(locale, slug))?.[1] ?? ""]),
      ];
      for (const [page, text] of descriptions) {
        expect(text?.length, `${locale} ${page}`).toBeGreaterThanOrEqual(50);
        expect(text?.length, `${locale} ${page}`).toBeLessThanOrEqual(160);
      }
    }
  });
});

describe("the data beside the page", () => {
  const names = { docs: "Docs", group: (id: string) => `group ${id}` };

  it("names Nestor as free software on the home page", () => {
    const [site, app] = homeGraph("fr", "d")["@graph"] as Record<string, unknown>[];
    expect(site?.["@type"]).toBe("WebSite");
    expect(app).toMatchObject({
      "@type": "SoftwareApplication",
      url: "https://nestorhome.dev/fr/",
      isAccessibleForFree: true,
    });
  });

  it("places a page of the docs under its group", () => {
    const graph = docGraph("en", { slug: "agent/memory", title: "Memory", description: "d" }, names)[
      "@graph"
    ] as Record<string, unknown>[];
    const trail = graph.find((thing) => thing["@type"] === "BreadcrumbList")?.itemListElement;
    expect(trail).toEqual([
      { "@type": "ListItem", position: 1, name: "Docs", item: "https://nestorhome.dev/docs/" },
      { "@type": "ListItem", position: 2, name: "group agent", item: "https://nestorhome.dev/docs/agent/" },
      { "@type": "ListItem", position: 3, name: "Memory", item: "https://nestorhome.dev/docs/agent/memory/" },
    ]);
    expect(graph.find((thing) => thing["@type"] === "TechArticle")).toMatchObject({
      headline: "Memory",
      inLanguage: "en",
    });
  });

  it("gives the first page of the docs only its own step", () => {
    const graph = docGraph("fr", { slug: "", title: "Introduction", description: "d" }, names)["@graph"] as Record<
      string,
      unknown
    >[];
    expect(graph.find((thing) => thing["@type"] === "BreadcrumbList")?.itemListElement).toHaveLength(1);
  });
});
