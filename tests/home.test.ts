/**
 * The home page's pieces that the build alone would not catch: the story's four moments each have
 * their words and their capture of the admin in both themes and languages, nothing else is shipped
 * as a capture, the film is there, and every group of integrations has its name.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES, translator } from "@/i18n";
import { INTEGRATIONS } from "@/lib/integrations";

/** The moments, in the order the page tells them (the list `Moments.astro` renders). */
const moments = JSON.parse(
  /const moments = (\[[^\]]+\]);/.exec(readFileSync("src/components/sections/Moments.astro", "utf8"))?.[1] ?? "[]",
) as string[];

describe("the story", () => {
  it("is told in four moments", () => {
    expect(moments).toHaveLength(4);
  });

  it("gives each moment a title, a text and a description of its picture in every language", () => {
    for (const locale of LOCALES) {
      const t = translator(locale);
      for (const name of moments) {
        for (const part of ["title", "text", "alt"]) expect(t(`moment-${name}-${part}`), locale).not.toBe("");
      }
    }
  });

  it("shows each moment by a capture of the admin in both themes and languages, and ships no other", () => {
    const expected = moments.flatMap((name) =>
      ["light", "dark"].flatMap((theme) => LOCALES.map((locale) => `${name}-${theme}-${locale}.webp`)),
    );
    expect(readdirSync("src/assets/captures").sort()).toEqual(expected.sort());
  });
});

describe("the film", () => {
  it("is shipped with its poster, where the page asks for them", () => {
    const film = readFileSync("src/components/Film.astro", "utf8");
    const asked = [...film.matchAll(/(?:src|poster)="(\/media\/[^"]+)"/g)].map((match) => match[1] ?? "");
    expect(asked.sort()).toEqual(["/media/film.mp4", "/media/film.poster.webp", "/media/film.webm"]);
    for (const path of asked) expect(existsSync(`public${path}`), path).toBe(true);
    expect(readdirSync("public/media").sort()).toEqual(["film.mp4", "film.poster.webp", "film.webm"]);
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
