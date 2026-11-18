import { expect, test } from "@playwright/test";
import { axe, renderAll, scrollThrough, watch } from "./helpers";

const PAGES = [
  { path: "/", lang: "en", title: /lives/ },
  { path: "/fr/", lang: "fr", title: /habite/ },
];
const WIDTHS = [390, 768, 1440];

for (const { path, lang, title } of PAGES) {
  for (const width of WIDTHS) {
    test(`${path} at ${width}px: no console error`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const problems = watch(page);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await scrollThrough(page);
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
  await page.goto("/docs/");
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute("href", /\/fr\/docs\/$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\/docs-en\.png$/);
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

const STORY = [
  {
    path: "/",
    locale: "en",
    titles: [
      "You ask, once.",
      "It takes care of it.",
      "It finds the right person, in the right place.",
      "And you always know why.",
    ],
  },
  {
    path: "/fr/",
    locale: "fr",
    titles: [
      "Vous demandez, une fois.",
      "Il s’en occupe.",
      "Il trouve la bonne personne, au bon endroit.",
      "Et vous savez toujours pourquoi.",
    ],
  },
];
const SHOTS = ["today", "ongoing", "house", "journal"];

for (const { path, locale, titles } of STORY) {
  test(`${path} tells the story in four moments, each shown by the admin in the page's theme`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    await renderAll(page);
    const moments = page.locator("#story ol > li");
    await expect(moments.getByRole("heading", { level: 3 })).toHaveText(titles);
    /** the picture each moment shows: the capture's name, loaded, with a text */
    const shown = async () => {
      const names: string[] = [];
      for (const moment of await moments.all()) {
        await moment.scrollIntoViewIfNeeded();
        const pictures = moment.locator("img:visible");
        await expect(pictures).toHaveCount(1);
        await expect(pictures).toHaveAttribute("alt", /\S/);
        await expect.poll(() => pictures.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
        names.push(await pictures.evaluate((img: HTMLImageElement) => decodeURIComponent(img.currentSrc)));
      }
      return names;
    };
    const dark = await page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches);
    const [theme, other] = dark ? ["dark", "light"] : ["light", "dark"];
    const first = await shown();
    SHOTS.forEach((name, i) => {
      expect(first[i]).toContain(`${name}-${theme}-${locale}`);
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole("button", { name: /light and dark|clair et sombre/ }).click();
    const second = await shown();
    SHOTS.forEach((name, i) => {
      expect(second[i]).toContain(`${name}-${other}-${locale}`);
    });
  });
}

test("the film plays only while it is on screen, and its button pauses it for good", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await renderAll(page);
  const film = page.locator("video#film");
  const button = page.getByRole("button", { name: "Pause the recording" });
  const paused = () => film.evaluate((video: HTMLVideoElement) => video.paused);
  const show = (selector: string) =>
    page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "center", behavior: "instant" }), selector);
  await expect(film).toHaveJSProperty("muted", true);
  await show("#film");
  await expect.poll(paused).toBe(false);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await show("#start");
  await expect.poll(paused).toBe(true);
  await show("#film");
  await expect.poll(paused).toBe(false);
  await button.click();
  await expect.poll(paused).toBe(true);
  await expect(button).toHaveAttribute("aria-pressed", "true");
  // paused by the visitor: coming back to it does not start it again
  await show("#start");
  await show("#film");
  await page.waitForTimeout(600);
  expect(await paused()).toBe(true);
  await button.click();
  await expect.poll(paused).toBe(false);
});

test("the install box shows the documentation's commands, one way at a time, and copies them", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  /** every line of code a page of the documentation holds */
  const documented = async (path: string) => {
    await page.goto(path);
    const blocks = await page.locator(".doc-prose pre").evaluateAll((pres) => pres.map((p) => p.textContent ?? ""));
    return blocks.flatMap((block) => block.split("\n").map((line) => line.replace(/\s+#.*$/, "").trim()));
  };
  const quickstart = await documented("/docs/quickstart/");
  const install = await documented("/docs/install/");

  await page.goto("/");
  const box = page.getByRole("group", { name: "Install" });
  const ways = box.locator(".copy-command");
  await expect(box.getByRole("radio", { name: "uv", exact: true })).toBeChecked();
  await expect(ways.filter({ visible: true })).toHaveCount(1);
  await expect(ways.filter({ visible: true })).toContainText("uv tool install nestor-home");
  await ways.filter({ visible: true }).getByRole("button", { name: "Copy" }).click();
  const uv = (await page.evaluate(() => navigator.clipboard.readText())).split("\n");
  expect(uv[0]).toBe("uv tool install nestor-home");
  expect(uv.at(-1)).toBe("nestor run");
  expect(uv.filter((line) => !quickstart.includes(line))).toEqual([]);
  await expect(ways.filter({ visible: true }).getByRole("button", { name: "Copied" })).toBeVisible();

  // the other way, from the keyboard
  await box.getByRole("radio", { name: "uv", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(box.getByRole("radio", { name: "Docker" })).toBeChecked();
  await expect(ways.filter({ visible: true })).toHaveCount(1);
  await ways.filter({ visible: true }).getByRole("button", { name: "Copy" }).click();
  const docker = (await page.evaluate(() => navigator.clipboard.readText())).split("\n");
  expect(docker.length).toBeGreaterThan(1);
  expect(docker.every((line) => line.startsWith("docker run "))).toBe(true);
  expect(docker.filter((line) => !install.includes(line))).toEqual([]);

  // the last section repeats the quickstart, whole
  const terminal = page.locator("#start .copy-command");
  await terminal.getByRole("button", { name: "Copy" }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).split("\n")).toEqual(uv);
});

test("the last section leads to the guide and to the three ways to build on Nestor", async ({ page, request }) => {
  for (const root of ["/", "/fr/"]) {
    await page.goto(root);
    const start = page.locator("#start");
    await expect(start.locator("a.btn-ink")).toHaveAttribute("href", `${root}docs/`);
    const cards = await start.locator("a.cta-card").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(cards).toEqual([`${root}docs/satellites/`, `${root}docs/sdks/python/`, `${root}docs/satellites/protocol/`]);
    for (const href of cards) expect((await request.get(href ?? "")).status(), href ?? "").toBe(200);
  }
});

test("moving through the page never shifts the layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    (window as unknown as { cls: number }).cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) (window as unknown as { cls: number }).cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await scrollThrough(page);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.02);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the home page reads in full, and the install box still changes way", async ({ page }) => {
    await page.goto("/");
    const hidden = await page
      .locator("[data-reveal]")
      .evaluateAll((nodes) => nodes.filter((n) => Number(getComputedStyle(n).opacity) < 1).length);
    expect(hidden).toBe(0);
    await expect(page.locator("#story ol > li")).toHaveCount(4);
    const ways = page.getByRole("group", { name: "Install" }).locator(".copy-command");
    await expect(ways.filter({ visible: true })).toContainText("uv tool install nestor-home");
    await page.getByRole("group", { name: "Install" }).getByText("Docker", { exact: true }).click();
    await expect(ways.filter({ visible: true })).toHaveCount(1);
    await expect(ways.filter({ visible: true })).toContainText("docker run");
  });
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
  // uncompressed: only the site script
  expect(js).toBeLessThan(12_000);
  expect(js).toBeGreaterThan(3_000);
  const alts = await page.locator("img").evaluateAll((imgs) => imgs.filter((i) => !(i as HTMLImageElement).alt).length);
  expect(alts).toBe(0);
});

for (const { path } of PAGES) {
  test(`${path} has no WCAG 2 A/AA violation (axe)`, async ({ page }) => {
    // still: reveals and demonstrations are shown at once, so axe reads the final colours
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await renderAll(page);
    await scrollThrough(page);
    expect(await axe(page)).toEqual([]);
  });
}

test("one navigation on every page, with the current page marked", async ({ page }) => {
  for (const [path, current] of [
    ["/", "Product"],
    ["/docs/", "Docs"],
  ] as const) {
    await page.goto(path);
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    await expect(nav.getByRole("link")).toHaveText(["Product", "Docs"]);
    await expect(nav.getByRole("link", { name: current })).toHaveAttribute("aria-current", "page");
  }
});

test("on a phone, the menu is a sheet that keeps focus and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Menu" });
  await button.click();
  const sheet = page.getByRole("dialog", { name: "Menu" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Product" })).toHaveAttribute("aria-current", "page");
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  expect(await sheet.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(button).toBeFocused();
});

/* No content runs out of its box: a block whose content is wider than itself must scroll on its
   own (code, wide diagrams), never spill over its neighbours, and the page never scrolls sideways.
   Page-level scroll alone misses the first. */
const BOXED = [
  ...PAGES.map((p) => p.path),
  "/docs/",
  "/docs/quickstart/",
  "/fr/docs/install/",
  "/fr/docs/configuration/",
  "/docs/models/",
  "/docs/connections/",
  "/docs/agent/",
  "/docs/agent/journal/",
  "/fr/docs/plugins/",
  "/fr/docs/agent/memory/",
  "/fr/docs/agent/initiative/",
  "/docs/satellites/protocol/",
  "/fr/docs/satellites/protocol/",
  "/docs/sdks/rust/",
  "/fr/docs/sdks/rust/",
];
for (const path of BOXED) {
  for (const width of WIDTHS) {
    test(`${path} at ${width}px: no horizontal scroll, no content overflows its box`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await renderAll(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const spilled = await page.evaluate(() =>
        [...document.querySelectorAll("main *")].flatMap((el) => {
          if (el.closest("svg")) return [];
          const style = getComputedStyle(el);
          if (style.display === "inline" || style.display === "none" || style.overflowX !== "visible") return [];
          if (el.clientWidth === 0 || el.scrollWidth <= el.clientWidth + 1) return [];
          return [
            `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")}: ${el.scrollWidth} > ${el.clientWidth}`,
          ];
        }),
      );
      expect(spilled).toEqual([]);
    });
  }
}

test("integrations are grouped by what they bring, and those not shipped yet say so", async ({ page }) => {
  await page.goto("/");
  const list = page.locator("#works-with");
  await expect(list.getByRole("heading", { level: 3 })).toHaveText([
    "Home",
    "Messages",
    "Mail, calendar and files",
    "Web, weather and maps",
    "Lists, notes and music",
    "Work and long tasks",
  ]);
  await expect(list.getByRole("listitem").filter({ hasText: "Home Assistant" })).toBeVisible();
  await expect(list.getByRole("listitem").filter({ hasText: "Spotify" })).toContainText("planned");
  await expect(list.getByRole("listitem").filter({ hasText: "Telegram" })).not.toContainText("planned");
});
