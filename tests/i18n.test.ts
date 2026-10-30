import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "@fluent/syntax";
import { describe, expect, it } from "vitest";
import { href, LOCALES, localePath, markup, sourcesOf, translator } from "@/i18n";

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
      const t = translator(locale);
      expect(
        [...asked].filter((id) => !t.has(id)),
        locale,
      ).toEqual([]);
    }
  });

  it("refuse a message that does not exist instead of printing its id", () => {
    expect(() => translator("en")("no-such-message")).toThrow(/missing message/);
  });

  it("format variables in the reader's language", () => {
    expect(translator("en")("story-step", { n: 3, total: 8 })).toBe("Step 3 of 8");
    expect(translator("fr")("story-step", { n: 3, total: 8 })).toBe("Étape 3 sur 8");
  });
});

describe("light markup in messages", () => {
  it("escapes HTML before adding emphasis and code", () => {
    expect(markup("a <b> **strong** *em* `code`")).toBe(
      "a &lt;b&gt; <strong>strong</strong> <em>em</em> <code>code</code>",
    );
  });
});

describe("addresses", () => {
  it("serve English at the root and French under /fr/", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("fr", "/")).toBe("/fr/");
  });

  it("give each page its own address in each language", () => {
    expect(href("en", "developers", "start")).toBe("/developers/#start");
    expect(href("fr", "developers")).toBe("/fr/developpeurs/");
    expect(href("fr", "home")).toBe("/fr/");
  });
});
