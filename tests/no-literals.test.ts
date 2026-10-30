/**
 * Components hold no sentence: every visible word comes from the Fluent catalogues. This guard
 * reads the markup of the Astro components and the JSX of the islands and fails on any text node
 * or human-facing attribute (alt, aria-label, title, placeholder) written as a literal.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { literals } from "./literals";

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path, ext) : ext.test(name) ? [path] : [];
  });
}

describe("components", () => {
  it("contain no hard-coded sentences", () => {
    const offenders = files("src/components", /\.astro$/)
      .concat(files("src/layouts", /\.astro$/))
      .flatMap((file) => literals(readFileSync(file, "utf8")).map((text) => `${file}: ${text}`));
    expect(offenders).toEqual([]);
  });

  it("islands contain no hard-coded sentences", () => {
    const offenders = files("src/islands", /\.tsx$/).flatMap((file) => {
      const jsx = readFileSync(file, "utf8").split("return (").slice(1).join("\n");
      return literals(jsx).map((text) => `${file}: ${text}`);
    });
    expect(offenders).toEqual([]);
  });

  it("the guard catches a literal sentence", () => {
    expect(literals('---\nconst a = 1;\n---\n<p>Hello there</p><img alt="A picture" />')).toEqual([
      "Hello there",
      "A picture",
    ]);
    expect(literals('<p>{t("x")}</p>')).toEqual([]);
  });
});
