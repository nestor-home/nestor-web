import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "@fluent/syntax";
import { describe, expect, it } from "vitest";
import { href, LOCALES, sourcesOf, translator } from "@/i18n";

const ids = (locale: (typeof LOCALES)[number]) =>
  new Set(
    Object.values(sourcesOf(locale)).flatMap((text) =>
      parse(text, {}).body.flatMap((entry) => {
        if (entry.type === "Junk") throw new Error(`${locale}: unparsable Fluent: ${entry.content.slice(0, 80)}`);
        return entry.type === "Message" ? [entry.id.name] : [];
      }),
    ),
  );

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path, ext) : ext.test(name) ? [path] : [];
  });
}

describe("the catalogues", () => {
  it("say the same things in English and in French", () => {
    const en = ids("en");
    const fr = ids("fr");
    expect([...en].filter((id) => !fr.has(id))).toEqual([]);
    expect([...fr].filter((id) => !en.has(id))).toEqual([]);
    expect(en.size).toBeGreaterThan(100);
  });

  it("hold every message a component asks for by name", () => {
    const asked = new Set<string>();
    for (const file of files("src", /\.(astro|tsx|ts)$/).filter((f) => !f.includes("i18n"))) {
      for (const match of readFileSync(file, "utf8").matchAll(/\bt(?:\.html)?\("([a-z0-9-]+(?:\.[a-z]+)?)"/g)) {
        if (match[1]) asked.add(match[1]);
      }
    }
    expect(asked.size).toBeGreaterThan(50);
    for (const locale of LOCALES) {
      const held = ids(locale);
      expect(
        [...asked].filter((id) => !held.has(id.split(".")[0] ?? id)),
        locale,
      ).toEqual([]);
    }
  });

  it("hold nothing the site no longer asks for", () => {
    const source = files("src", /\.(astro|ts)$/)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    // ids written whole (`t("copy")`, a list of ids) and ids built from a part (`t(\`moment-${name}-title\`)`)
    const built = [...source.matchAll(/\bt\(`([a-z0-9-]*)\$\{[^}]+\}([a-z0-9-]*)`/g)].map(
      (match) => new RegExp(`^${match[1]}[a-z0-9-]+${match[2]}$`),
    );
    expect(built.length).toBeGreaterThan(10);
    const unused = [...ids("en")].filter(
      (id) => !new RegExp(`["'\`]${id}["'\`]`).test(source) && !built.some((pattern) => pattern.test(id)),
    );
    expect(unused).toEqual([]);
  });

  it("refuse a message that does not exist instead of printing its id", () => {
    expect(() => translator("en")("no-such-message")).toThrow(/missing message/);
  });

  it("format variables in the reader's language", () => {
    expect(translator("en")("providers-planned-note", { name: "Piper" })).toBe(
      "Piper is planned: Nestor does not support it yet.",
    );
    expect(translator("fr")("docs-meta-title", { title: "Modèles" })).toBe("Modèles · Documentation de Nestor");
  });
});

describe("addresses", () => {
  it("serve English at the root and French under /fr/", () => {
    expect(href("en", "home")).toBe("/");
    expect(href("fr", "home")).toBe("/fr/");
    expect(href("en", "docs")).toBe("/docs/");
    expect(href("fr", "docs")).toBe("/fr/docs/");
  });
});

describe("the copy", () => {
  it("does without em-dashes: a period, a colon or parentheses read better", () => {
    const lines = LOCALES.flatMap((locale) =>
      Object.entries(sourcesOf(locale)).flatMap(([file, text]) =>
        text
          .split("\n")
          .filter((line) => line.includes("—"))
          .map((line) => `${locale}/${file}: ${line}`),
      ),
    );
    expect(lines).toEqual([]);
  });
});
