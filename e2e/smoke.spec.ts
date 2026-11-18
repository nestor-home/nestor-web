import { expect, type Page, test } from "@playwright/test";
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
    titles: [
      "You say it, once.",
      "It keeps an eye on it.",
      "It finds you, wherever you are.",
      "Anything that listens can be a satellite.",
      "At home, it speaks in the right room.",
      "And you always know why.",
    ],
  },
  {
    path: "/fr/",
    titles: [
      "Vous le dites, une fois.",
      "Il garde un œil dessus.",
      "Il vous trouve, où que vous soyez.",
      "Tout ce qui écoute peut devenir un satellite.",
      "À la maison, il parle dans la bonne pièce.",
      "Et vous savez toujours pourquoi.",
    ],
  },
];

for (const { path, titles } of STORY) {
  test(`${path} tells one request in six chapters, in order`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("#story > .chapter")).toHaveCount(6);
    await expect(page.locator("#story > .chapter").getByRole("heading", { level: 2 })).toHaveText(titles);
  });
}

/** Each object, and what it shows last once it has played: the answer, the kept mail, the
    notification, the last body, why this room, the journal's reason. */
const OBJECTS = [
  { object: ".spoken", last: ".spoken-answer", text: "I’ll watch your mail" },
  { object: ".watch", last: ".watch-mail.is-kept", text: "for Mom" },
  { object: ".phone", last: ".phone-note", text: "Friday’s trip is on" },
  { object: ".sats", last: ".sat:last-child", text: "A camera" },
  { object: ".room", last: ".room-why:last-child", text: "Grandma is in her room" },
  { object: ".trace", last: ".trace-why", text: "Mom is out, says Home Assistant" },
];

/** The story's words drawn too faint to read (an element and its ancestors' opacity under one
    half), and the last thing each object shows when it is not fully there (faded or still moving). */
function unseen(page: Page): Promise<string[]> {
  return page.locator("#story").evaluate(
    (story, lasts) => {
      const opacity = (el: Element) => {
        let o = 1;
        for (let n: Element | null = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      };
      const words = [...story.querySelectorAll("*")].filter((el) =>
        [...el.childNodes].some((c) => c.nodeType === Node.TEXT_NODE && c.textContent?.trim()),
      );
      const faint = words.filter((el) => opacity(el) < 0.5).map((el) => `faint: ${el.textContent?.trim()}`);
      const partial = lasts.flatMap((selector) =>
        [...story.querySelectorAll(selector)]
          .filter((el) => opacity(el) < 1 || getComputedStyle(el).transform !== "none")
          .map(() => `not shown: ${selector}`),
      );
      return [...faint, ...partial];
    },
    OBJECTS.map((o) => o.last),
  );
}

test("scrolling to a chapter plays its object to the end", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const trace = page.locator("#story .trace");
  // below the fold, the journal waits for the reader
  await expect(trace).not.toHaveAttribute("data-shown");
  expect(
    await trace
      .locator(".trace-step")
      .last()
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("0");
  for (const { object, last, text } of OBJECTS) {
    const shown = page.locator(`#story ${object}`);
    await shown.scrollIntoViewIfNeeded();
    await expect(shown).toHaveAttribute("data-shown", "");
    const end = shown.locator(last);
    await expect(end).toContainText(text);
    await expect
      .poll(() =>
        end.evaluate((el) => {
          let o = 1;
          for (let n: Element | null = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
          return o === 1 && getComputedStyle(el).transform === "none";
        }),
      )
      .toBe(true);
  }
  expect(await unseen(page)).toEqual([]);
});

for (const { path } of PAGES) {
  test(`${path} at 375px: the story's objects stay within the page`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path);
    await scrollThrough(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const outside = await page.locator("#story .obj").evaluateAll((objects) =>
      objects
        .map((o) => [o.className, o.getBoundingClientRect()] as const)
        .filter(([, r]) => r.left < 0 || r.right > window.innerWidth)
        .map(([name]) => name),
    );
    expect(outside).toEqual([]);
  });
}

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
    await expect(page.locator("#story > .chapter")).toHaveCount(6);
    expect(await unseen(page)).toEqual([]);
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
  // before any scroll: every object already shows all it has
  expect(await unseen(page)).toEqual([]);
  await scrollThrough(page);
  const hidden = await page
    .locator("[data-reveal]")
    .evaluateAll((nodes) => nodes.filter((n) => Number(getComputedStyle(n).opacity) < 1).length);
  expect(hidden).toBe(0);
  expect(await unseen(page)).toEqual([]);
  // nothing runs on its own: every animation has ended at once
  await expect
    .poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length))
    .toBe(0);
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
