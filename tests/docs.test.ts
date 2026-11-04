/**
 * The developer documentation: every page of the reading order exists in both languages, links stay
 * in the reader's language, and the developers' page finds each SDK's example where it reads it.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES, type Locale } from "@/i18n";
import { DOC_SLUGS, docHref, firstCodeBlock, neighbours, parseDocId, taggedCommands } from "@/lib/docs";
import { PROVIDERS, type ProviderKind } from "@/lib/providers";
import { INSTALL, QUICKSTART } from "@/lib/site";

const ROOT = "src/content/docs";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.mdx?$/.test(name) ? [path] : [];
  });
}

/** `en/sdks/rust`, as the collection names it, for every Markdown (or MDX) file. */
const sources = new Map(files(ROOT).map((path) => [relative(ROOT, path).replace(/\.mdx?$/, ""), path]));
const ids = [...sources.keys()];
const read = (locale: string, slug: string) => readFileSync(sources.get(`${locale}/${slug || "index"}`) ?? "", "utf8");
const frontmatter = (text: string) => /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";

describe("the documentation", () => {
  it("has every page of the reading order in every language, and nothing outside it", () => {
    const expected = LOCALES.flatMap((locale) => DOC_SLUGS.map((slug) => `${locale}/${slug || "index"}`)).sort();
    expect([...ids].sort()).toEqual(expected);
  });

  it("gives every page a title and a description", () => {
    for (const id of ids) {
      const { locale, slug } = parseDocId(id);
      const meta = frontmatter(read(locale, slug));
      expect(meta, id).toMatch(/^title: \S/m);
      expect(meta, id).toMatch(/^description: \S/m);
    }
  });

  it("links to the documentation in the reader's own language", () => {
    const wrong = ids.flatMap((id) => {
      const { locale, slug } = parseDocId(id);
      const prefix = locale === "en" ? "/docs/" : `/${locale}/docs/`;
      return [...read(locale, slug).matchAll(/\]\((\/(?:[a-z]{2}\/)?docs\/[^)#]*)/g)]
        .map((m) => m[1] ?? "")
        .filter(
          (target) => !target.startsWith(prefix) || !DOC_SLUGS.some((s) => docHref(locale as Locale, s) === target),
        )
        .map((target) => `${id} → ${target}`);
    });
    expect(wrong).toEqual([]);
  });

  it("does without em-dashes", () => {
    const lines = ids.flatMap((id) => {
      const { locale, slug } = parseDocId(id);
      return read(locale, slug)
        .split("\n")
        .filter((line) => line.includes("—"))
        .map((line) => `${id}: ${line}`);
    });
    expect(lines).toEqual([]);
  });

  it("opens each SDK page with a driver in its language, which the developers' page shows", () => {
    for (const locale of LOCALES) {
      expect(firstCodeBlock(read(locale, "sdks/python"), "python")).toContain("Satellite(");
      expect(firstCodeBlock(read(locale, "sdks/typescript"), "ts")).toContain("new Satellite(");
      expect(firstCodeBlock(read(locale, "sdks/rust"), "rust")).toContain("Satellite::builder(");
    }
  });
});

describe("the commands the site shows", () => {
  it("are the documentation's tagged blocks, the same in every language", () => {
    expect(INSTALL[0]).toBe("uv tool install nestor-home");
    expect(INSTALL).toContain("nestor init");
    expect(INSTALL.at(-1)).toBe("nestor run");
    expect(QUICKSTART.map((s) => s.id)).toEqual(["qs-1", "qs-2", "qs-3"]);
    expect(QUICKSTART[0]?.command).toBe("docker run -it --rm -v ./nestor:/data ghcr.io/nestor-home/nestor init");
    for (const locale of LOCALES) {
      expect(taggedCommands(read(locale, "quickstart"), "quickstart").flat(), locale).toEqual(INSTALL);
      expect(taggedCommands(read(locale, "install"), "docker-quickstart").flat().join(" && "), locale).toBe(
        QUICKSTART.map((s) => s.command).join(" && "),
      );
    }
  });

  it("are found by their exact tag, never by a longer one", () => {
    const page = "```bash docker-quickstart\ndocker run x\n```\n\n```bash quickstart\nuv tool install y  # z\n```\n";
    expect(taggedCommands(page, "quickstart")).toEqual([["uv tool install y"]]);
    expect(taggedCommands(page, "docker-quickstart")).toEqual([["docker run x"]]);
  });
});

describe("the provider mosaics", () => {
  it("give every available provider a setup in every language, and none to a planned one", () => {
    for (const locale of LOCALES) {
      const text = read(locale, "models") + read(locale, "channels");
      const setups = [...text.matchAll(/<ProviderSetup kind="(\w+)" brand="([\w-]+)">/g)].map((m) => `${m[1]}/${m[2]}`);
      const available = (Object.keys(PROVIDERS) as ProviderKind[]).flatMap((kind) =>
        PROVIDERS[kind].filter((p) => p.status === "available").map((p) => `${kind}/${p.brand}`),
      );
      expect(setups.sort(), locale).toEqual(available.sort());
    }
  });
});

describe("the reading order", () => {
  it("leads from one page to the next, with nothing before the first or after the last", () => {
    expect(neighbours("")).toEqual({ next: "quickstart" });
    expect(neighbours("agent/initiative")).toEqual({ previous: "agent/memory", next: "agent/speakers" });
    expect(neighbours("agent/speakers")).toEqual({ previous: "agent/initiative", next: "configuration" });
    expect(neighbours("satellites/protocol")).toEqual({ previous: "satellites", next: "satellites/schemas" });
    expect(neighbours(DOC_SLUGS.at(-1) ?? "")).toEqual({ previous: DOC_SLUGS.at(-2) });
    expect(neighbours("no/such/page")).toEqual({});
  });

  it("serves English under /docs/ and French under /fr/docs/", () => {
    expect(docHref("en", "")).toBe("/docs/");
    expect(docHref("fr", "sdks/rust")).toBe("/fr/docs/sdks/rust/");
    expect(parseDocId("fr/index")).toEqual({ locale: "fr", slug: "" });
    expect(parseDocId("en/satellites/protocol")).toEqual({ locale: "en", slug: "satellites/protocol" });
  });
});

describe("a page's example", () => {
  it("is the first block of the language asked, not another language's", () => {
    const text = "Install:\n\n```bash\npip install x\n```\n\n```python\nprint(1)\n```\n\n```python\nprint(2)\n```\n";
    expect(firstCodeBlock(text, "python")).toBe("print(1)\n");
    expect(firstCodeBlock(text, "rust")).toBeUndefined();
  });
});
