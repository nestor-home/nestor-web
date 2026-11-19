import { describe, expect, it } from "vitest";
import { nextIndex } from "@/lib/tabs";

describe("the tab lists", () => {
  it("move with the arrows of their orientation and wrap around", () => {
    expect(nextIndex("ArrowRight", 2, 3)).toBe(0);
    expect(nextIndex("ArrowLeft", 0, 3)).toBe(2);
    expect(nextIndex("Home", 2, 3)).toBe(0);
    expect(nextIndex("End", 0, 3)).toBe(2);
    expect(nextIndex("ArrowDown", 2, 3, "vertical")).toBe(0);
    expect(nextIndex("ArrowUp", 0, 3, "vertical")).toBe(2);
    expect(nextIndex("ArrowRight", 0, 3, "vertical")).toBeNull();
    expect(nextIndex("a", 0, 3)).toBeNull();
  });

  it("leave the up and down arrows to the page in a horizontal list, and take all four in a grid", () => {
    expect(nextIndex("ArrowDown", 0, 3)).toBeNull();
    expect(nextIndex("ArrowUp", 1, 3)).toBeNull();
    expect(nextIndex("ArrowDown", 0, 3, "both")).toBe(1);
    expect(nextIndex("ArrowLeft", 0, 3, "both")).toBe(2);
  });
});
