/**
 * Sizes come from the type scale (Tailwind's, plus the few steps declared once in global.css's
 * `@theme`): a component names `text-sm` or `var(--text-sm)`, never a size of its own.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : name.endsWith(".astro") ? [path] : [];
  });
}

describe("the type scale", () => {
  it("is the only source of font sizes in components", () => {
    const sizes = files("src").flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, i) =>
          [...line.matchAll(/text-\[\d[^\]]*\]|font-size:\s*[\d.]+rem/g)].map((m) => `${file}:${i + 1} ${m[0]}`),
        ),
    );
    expect(sizes).toEqual([]);
  });
});
