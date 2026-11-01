/** The arrows a tab list answers to: its `aria-orientation`, or both for a grid of tabs. */
export type TabAxes = "horizontal" | "vertical" | "both";

/** The axes of a tab list element: `aria-orientation="vertical"`, `data-tabs-grid`, or horizontal. */
export function tabAxes(list: Element): TabAxes {
  if (list.hasAttribute("data-tabs-grid")) return "both";
  return list.getAttribute("aria-orientation") === "vertical" ? "vertical" : "horizontal";
}

/**
 * The tab a key moves to in a tab list of `count` tabs, or null for a key the list leaves alone
 * (ArrowDown in a horizontal list keeps scrolling the page).
 */
export function nextIndex(key: string, current: number, count: number, axes: TabAxes = "horizontal"): number | null {
  const across = axes !== "vertical";
  const down = axes !== "horizontal";
  if ((key === "ArrowRight" && across) || (key === "ArrowDown" && down)) return (current + 1) % count;
  if ((key === "ArrowLeft" && across) || (key === "ArrowUp" && down)) return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
