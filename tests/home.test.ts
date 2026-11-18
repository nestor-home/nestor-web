/**
 * The home page's pieces that the build alone would not catch: the story is told in five chapters,
 * each with its words in both languages, every word its objects show exists in both languages,
 * nothing is shipped as media, and every group of integrations has its name.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES, translator } from "@/i18n";
import { INTEGRATIONS } from "@/lib/integrations";

const STORY = "src/components/sections/Story.astro";

/** The chapters, in the order `Story.astro` renders them: their id and the object that shows them. */
const chapters = [...readFileSync(STORY, "utf8").matchAll(/\{ id: "([a-z]+)", object: (\w+) \}/g)].map((m) => ({
  id: m[1] ?? "",
  object: m[2] ?? "",
}));

/**
 * The `story-*` messages an object asks for: those it names whole, and those it builds from a list
 * it draws (`t(\`story-watch-${m.id}\`)` over `mails`), only for the items a guard lets through
 * (`{s.why && t(\`story-why-${s.id}-why\`)}` asks only for the steps with `why`).
 */
function asked(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const ids = new Set([...source.matchAll(/["'](story-[a-z0-9-]+)["']/g)].map((m) => m[1] ?? ""));
  const lists = new Map(
    [...source.matchAll(/const (\w+) = (\[[\s\S]*?\]);/g)].map((m) => [
      m[1] ?? "",
      new Function(`return ${m[2]}`)() as Record<string, unknown>[],
    ]),
  );
  const built = [...source.matchAll(/^.*\bt\(`(story-[a-z0-9-]*)\$\{(\w+)\.id\}([a-z0-9-]*)`\).*$/gm)];
  for (const [line, prefix, item, suffix] of built) {
    const list = new RegExp(`(\\w+)\\.map\\(\\(${item}\\b`).exec(source)?.[1] ?? "";
    const items = lists.get(list);
    if (!items) throw new Error(`${file}: no list drawn as ${item}`);
    const guard = new RegExp(`\\{${item}\\.(\\w+) &&`).exec(line)?.[1];
    for (const it of items) if (!guard || it[guard]) ids.add(`${prefix}${it.id}${suffix}`);
  }
  return [...ids];
}

describe("the story", () => {
  it("is told in five chapters, each shown by its object, in this order", () => {
    expect(chapters).toEqual([
      { id: "ask", object: "Spoken" },
      { id: "watch", object: "Watch" },
      { id: "found", object: "Phone" },
      { id: "reminder", object: "Room" },
      { id: "why", object: "Trace" },
    ]);
  });

  it("gives each chapter a title and a text in every language", () => {
    for (const locale of LOCALES) {
      const t = translator(locale);
      expect(t("story-label"), locale).not.toBe("");
      for (const { id } of chapters) {
        for (const part of ["title", "text"]) expect(t(`story-${id}-${part}`), locale).not.toBe("");
      }
    }
  });

  it("has every word its objects ask for, in every language", () => {
    const words = chapters.flatMap(({ object }) => asked(`src/components/objects/${object}.astro`));
    // the lists are read: the watch's three mails, the journal's five steps and its one reason
    expect(words).toEqual(
      expect.arrayContaining(["story-watch-school", "story-why-closed", "story-why-sent-why", "story-found-message"]),
    );
    expect(words).not.toContain("story-why-asked-why");
    for (const locale of LOCALES) {
      const t = translator(locale);
      const missing = words.filter((id) => {
        try {
          return t(id) === "";
        } catch {
          return true;
        }
      });
      expect(missing, locale).toEqual([]);
    }
  });
});

describe("the media", () => {
  it("are none: the page ships no picture and no film of its own", () => {
    expect(existsSync("public/media") ? readdirSync("public/media") : []).toEqual([]);
  });
});

describe("the integrations", () => {
  it("name every group in every language, and have a word for what is not shipped yet", () => {
    for (const locale of LOCALES) {
      const t = translator(locale);
      for (const { group } of INTEGRATIONS) expect(t(`int-group-${group}`), locale).not.toBe("");
      expect(t("int-planned"), locale).not.toBe("");
    }
  });
});
