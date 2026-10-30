import { createRequire } from "node:module";
import { expect, type Page, test } from "@playwright/test";

const require = createRequire(import.meta.url);

const PAGES = [
  { path: "/", lang: "en", title: /lives/ },
  { path: "/fr/", lang: "fr", title: /habite/ },
  { path: "/developers/", lang: "en", title: /Build with Nestor/ },
  { path: "/fr/developpeurs/", lang: "fr", title: /Construire avec Nestor/ },
];
const WIDTHS = [390, 768, 1440];

/** Collects console errors and failed requests for a page's whole life. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(String(e)));
  page.on("requestfailed", (r) => problems.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  return problems;
}

async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(40);
  }
}

for (const { path, lang, title } of PAGES) {
  for (const width of WIDTHS) {
    test(`${path} at ${width}px: no console error, no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const problems = watch(page);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await scrollThrough(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(problems).toEqual([]);
    });
  }
}

test("each language links to the other, with canonical and hreflang", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/$/);
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute("href", /\/fr\/$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\/home-en\.png$/);
  await page.getByRole("link", { name: "Lire cette page en français" }).click();
  await expect(page).toHaveURL(/\/fr\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page.goto("/developers/");
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute("href", /\/fr\/developpeurs\/$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\/developers-en\.png$/);
});

test("the skip link reaches the content from the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("the theme toggle switches the page and remembers it", async ({ page }) => {
  await page.goto("/");
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByRole("button", { name: "Switch between light and dark" }).click();
  const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(after).not.toBe(before);
  await page.reload();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(after);
});

test("the story's stage follows the step being read", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/developers/");
  const stage = page.locator("[data-stage]");
  await page.evaluate(() => document.querySelector('li[data-step="5"]')?.scrollIntoView({ block: "center" }));
  await expect(stage).toHaveAttribute("data-step", "5");
  await page.evaluate(() => document.querySelector('li[data-step="7"]')?.scrollIntoView({ block: "center" }));
  await expect(stage).toHaveAttribute("data-step", "7");
});

test("choosing a part of the architecture explains it", async ({ page }) => {
  await page.goto("/developers/#system");
  const connectors = page.getByRole("button", { name: "Connectors", exact: true });
  await connectors.click();
  await expect(connectors).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#arch-detail").getByRole("heading", { name: "Connectors" })).toBeVisible();
  await expect(page.locator("#arch-detail")).toContainText("CredentialVault");
});

test("the SDK tabs work with the arrow keys", async ({ page }) => {
  await page.goto("/developers/#satellites");
  const python = page.getByRole("tab", { name: "Python" });
  await python.click();
  await page.keyboard.press("ArrowRight");
  const ts = page.getByRole("tab", { name: "TypeScript" });
  await expect(ts).toHaveAttribute("aria-selected", "true");
  await expect(ts).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("browserWebRtc");
});

test("a quickstart command is copied", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/developers/#start");
  await page.locator("#start").getByRole("button", { name: "Copy" }).nth(1).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("docker compose run --rm nestor init");
  await expect(page.locator("#start").getByRole("button", { name: "Copied" })).toBeVisible();
});

test("under reduced motion everything is shown, nothing moves by itself", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await scrollThrough(page);
  const hidden = await page
    .locator("[data-reveal]")
    .evaluateAll((nodes) => nodes.filter((n) => Number(getComputedStyle(n).opacity) < 1).length);
  expect(hidden).toBe(0);
  const playing = await page
    .locator("video")
    .evaluateAll((v) => v.filter((x) => !(x as HTMLVideoElement).paused).length);
  expect(playing).toBe(0);
  await context.close();
});

test("the home page loads no framework, and every picture has a text", async ({ page }) => {
  await page.goto("/");
  await scrollThrough(page);
  const { js } = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const sum = (filter: (e: PerformanceResourceTiming) => boolean) =>
      entries.filter(filter).reduce((total, e) => total + e.decodedBodySize, 0);
    return {
      js: sum((e) => e.initiatorType === "script" || e.name.endsWith(".js")),
      images: entries.filter((e) => e.initiatorType === "img").length,
    };
  });
  // uncompressed: only the site script (React is for the developers' architecture diagram)
  expect(js).toBeLessThan(30_000);
  expect(js).toBeGreaterThan(3_000);
  const alts = await page.locator("img").evaluateAll((imgs) => imgs.filter((i) => !(i as HTMLImageElement).alt).length);
  expect(alts).toBe(0);
});

for (const { path } of PAGES) {
  test(`${path} has no WCAG 2 A/AA violation (axe)`, async ({ page }) => {
    await page.goto(path);
    await page.addStyleTag({ content: ".section{content-visibility:visible!important}" });
    await scrollThrough(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500); // let the last reveals and the pairing demonstration finish
    await page.addScriptTag({ path: require.resolve("axe-core") });
    const violations = await page.evaluate(async () => {
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
    expect(violations).toEqual([]);
  });
}

test("Nestor answers in the hero: it listens, then speaks", async ({ page }) => {
  await page.goto("/");
  const nestor = page.locator("#hero-nestor");
  await expect(nestor).toHaveAttribute("data-state", "listening", { timeout: 4000 });
  await expect(nestor).toHaveAttribute("data-state", "speaking", { timeout: 6000 });
  await expect(page.locator("[data-hero-stage]")).toHaveAttribute("data-phase", "say");
});

test("a scene of the day plays when it comes into view", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator("#day .scene").nth(4);
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-inview", "");
  await expect(scene.locator(".nestor")).toHaveAttribute("data-state", "speaking", { timeout: 3000 });
});
