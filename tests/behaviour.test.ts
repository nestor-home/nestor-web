import { describe, expect, it } from "vitest";
import { related } from "@/islands/Architecture";
import { nextIndex } from "@/lib/tabs";

describe("the SDK tabs", () => {
  it("move with the arrows and wrap around", () => {
    expect(nextIndex("ArrowRight", 2, 3)).toBe(0);
    expect(nextIndex("ArrowLeft", 0, 3)).toBe(2);
    expect(nextIndex("Home", 2, 3)).toBe(0);
    expect(nextIndex("End", 0, 3)).toBe(2);
    expect(nextIndex("a", 0, 3)).toBeNull();
  });
});

describe("the architecture diagram", () => {
  it("lights what a part talks to", () => {
    expect([...related("connectors")].sort()).toEqual(["agent", "connectors", "initiative", "journal"]);
  });

  it("lights the outer parts that reach a module of the core", () => {
    const agent = related("agent");
    for (const outer of ["channels", "satellites", "home", "connectors", "executors", "providers"] as const) {
      expect(agent.has(outer)).toBe(true);
    }
    expect(related("memory").has("providers")).toBe(false);
  });
});
