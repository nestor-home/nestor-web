import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { density, lit } from "@/character/dither";

const ADMIN_TOKENS = "../nestor/web/src/styles/tokens.css";

describe("the identity", () => {
  it.skipIf(!existsSync(ADMIN_TOKENS))("uses the admin's tokens, unchanged", () => {
    expect(readFileSync("src/styles/tokens.css", "utf8")).toBe(readFileSync(ADMIN_TOKENS, "utf8"));
  });
});

describe("the dither", () => {
  it("lights about as many dots as the density asks", () => {
    for (const d of [0.1, 0.25, 0.5, 0.8]) {
      let on = 0;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (lit("field", x, y, 64, 64, d, d)) on++;
      expect(on / 4096).toBeCloseTo(d, 1);
    }
  });

  it("ramps from one side to the other", () => {
    expect(density("ramp-right", 0, 0.5, 0, 1)).toBe(0);
    expect(density("ramp-right", 1, 0.5, 0, 1)).toBe(1);
    expect(density("horizon", 0.5, 0, 0, 1)).toBeLessThan(density("horizon", 0.5, 1, 0, 1));
  });
});

const ADMIN_CHARACTER = "../nestor/web/src/character";
const CHARACTER_FILES = [
  "geometry.ts",
  "render.ts",
  "controller.ts",
  "dither.ts",
  "nestor.css",
  "react.tsx",
  "index.ts",
];

describe("the character", () => {
  it.skipIf(!existsSync(ADMIN_CHARACTER))("is the admin's module, unchanged", () => {
    for (const file of CHARACTER_FILES) {
      expect(readFileSync(`src/character/${file}`, "utf8"), file).toBe(
        readFileSync(`${ADMIN_CHARACTER}/${file}`, "utf8"),
      );
    }
  });
});
