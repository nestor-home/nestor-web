import { createRequire } from "node:module";
import type { Page } from "@playwright/test";

const require = createRequire(import.meta.url);

/** Collects console errors, page errors, failed requests and error responses for a page's whole life. */
export function watch(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(String(e)));
  page.on("requestfailed", (r) => problems.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  return problems;
}

/** Scrolls down the whole page, so every observer sees every element. */
export async function scrollThrough(page: Page): Promise<void> {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(40);
  }
}

/** Lays out every section now: sections off screen are skipped until seen (`content-visibility`). */
export async function renderAll(page: Page): Promise<void> {
  await page.addStyleTag({ content: ".section{content-visibility:visible!important}" });
}

/** The page's WCAG 2 A/AA violations, as axe reports them (rule: first targets). */
export async function axe(page: Page): Promise<string[]> {
  await page.addScriptTag({ path: require.resolve("axe-core") });
  return page.evaluate(async () => {
    // @ts-expect-error axe is injected above
    const result = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] });
    return result.violations.map(
      (v: { id: string; nodes: { target: string[] }[] }) =>
        `${v.id}: ${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 4)
          .join(", ")}`,
    );
  });
}
