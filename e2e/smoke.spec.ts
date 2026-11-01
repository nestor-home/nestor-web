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
  await page.goto("/");
  const stage = page.locator("[data-stage]");
  await page.evaluate(() => document.querySelector('li[data-step="2"]')?.scrollIntoView({ block: "center" }));
  await expect(stage).toHaveAttribute("data-step", "2");
  await page.evaluate(() => document.querySelector('li[data-step="4"]')?.scrollIntoView({ block: "center" }));
  await expect(stage).toHaveAttribute("data-step", "4");
});

test("moving the person changes the delivery decision", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.querySelector('li[data-step="3"]')?.scrollIntoView({ block: "center" }));
  const story = page.locator("#story");
  const step = page.locator('li[data-step="3"]');
  await expect(step.getByText("Says it aloud, on the office speaker.")).toBeVisible();
  const out = step.getByRole("button", { name: "Out" });
  await out.click();
  await expect(out).toHaveAttribute("aria-pressed", "true");
  await expect(story).toHaveAttribute("data-where", "out");
  await expect(step.getByText("Writes to her phone.")).toBeVisible();
  await step.getByRole("button", { name: "Asleep" }).click();
  await expect(step.getByText("Keeps it for the morning: quiet hours.")).toBeVisible();
  await expect(page.locator("[data-stage] svg.nestor")).toHaveAttribute("data-state", "sleeping");
});

test("a device added to the constellation pairs, links to Nestor and carries the conversation", async ({ page }) => {
  await page.goto("/#bodies");
  const sky = page.locator("#bodies [data-constellation]");
  const phone = sky.getByRole("button", { name: "An old phone" });
  await expect(phone).toHaveAttribute("aria-pressed", "false");
  await expect(sky.getByText("Wake me up at seven.")).toBeHidden();
  await phone.click();
  await expect(phone).toHaveAttribute("data-pairing", "");
  await expect(phone).toHaveAttribute("aria-pressed", "true", { timeout: 3000 });
  await expect(sky.locator('line[data-dev="phone"]')).toHaveAttribute("data-on", "");
  await expect(sky.getByText("Wake me up at seven.")).toBeVisible();
  await phone.click();
  await expect(phone).toHaveAttribute("aria-pressed", "false");
});

test("the journal's events can be read one by one", async ({ page }) => {
  await page.goto("/developers/#journal");
  const decision = page.getByRole("tab", { name: /The decision/ });
  await decision.click();
  await expect(page.locator("#ev-4")).toContainText("delivery-in-room");
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
  await expect(page.locator("#satellites").getByRole("tabpanel")).toContainText("browserWebRtc"); // the TypeScript SDK page’s first example
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

test.describe("Nestor in the page", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("looks toward the pointer", async ({ page }) => {
    await page.goto("/");
    const nestor = page.locator("#hero-nestor");
    await expect(nestor).toHaveAttribute("data-running", "true");
    const gx = () => nestor.evaluate((el) => Number((el as SVGElement).style.getPropertyValue("--nestor-gx")));
    await page.mouse.move(20, 450);
    await expect.poll(gx).toBeLessThan(-1);
    await page.mouse.move(1420, 450);
    await expect.poll(gx).toBeGreaterThan(1);
  });

  test("pauses while the tab is hidden, and wakes up when it comes back", async ({ page }) => {
    await page.goto("/");
    const nestor = page.locator("#hero-nestor");
    await expect(nestor).toHaveAttribute("data-running", "true");
    const setHidden = (hidden: boolean) =>
      page.evaluate((value) => {
        Object.defineProperty(document, "hidden", { value, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      }, hidden);
    await setHidden(true);
    await expect(nestor).toHaveAttribute("data-running", "false");
    await setHidden(false);
    await expect(nestor).toHaveAttribute("data-running", "true");
  });

  test("docks in the margin after the hero, takes the mood of the step, and can be hidden", async ({ page }) => {
    await page.goto("/");
    const dock = page.locator("[data-dock]");
    await expect(dock).not.toHaveAttribute("data-shown", "");
    await page.evaluate(() => document.querySelector('li[data-step="3"]')?.scrollIntoView({ block: "center" }));
    await expect(dock).toHaveAttribute("data-shown", "");
    await expect(dock.locator("svg.nestor")).toHaveAttribute("data-state", "speaking");
    const box = await dock.boundingBox();
    // the text column ends where the wrap's padding begins; the dock stays to its right
    const textRight = await page
      .locator("main .wrap")
      .first()
      .evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right - Number.parseFloat(getComputedStyle(el).paddingRight);
      });
    expect(box?.x ?? 0).toBeGreaterThanOrEqual(textRight);
    await dock.hover();
    await page.getByRole("button", { name: "Hide Nestor" }).click();
    await expect(dock).toBeHidden();
  });

  test("moves nothing by itself under reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/");
    const nestor = page.locator("#hero-nestor");
    await page.mouse.move(20, 450);
    const before = await nestor.evaluate((el) => el.outerHTML);
    await page.mouse.move(1420, 800);
    await page.waitForTimeout(1500);
    expect(await nestor.evaluate((el) => el.outerHTML)).toBe(before);
    await expect(nestor).not.toHaveAttribute("data-live", "");
    await page.evaluate(() => window.scrollTo(0, 3000));
    await expect(page.locator("[data-dock]")).toBeHidden();
    await context.close();
  });

  test("never shifts the layout", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (window as unknown as { cls: number }).cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) (window as unknown as { cls: number }).cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.mouse.move(300, 300);
    await page.mouse.move(1200, 700, { steps: 8 });
    await scrollThrough(page);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.02);
  });
});

test("one navigation on every page, with the current page marked", async ({ page }) => {
  for (const [path, current] of [
    ["/", "Product"],
    ["/developers/", "Developers"],
    ["/docs/", "Docs"],
  ] as const) {
    await page.goto(path);
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    await expect(nav.getByRole("link")).toHaveText(["Product", "Developers", "Docs"]);
    await expect(nav.getByRole("link", { name: current })).toHaveAttribute("aria-current", "page");
  }
});

test("on a phone, the menu is a sheet that keeps focus and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/developers/");
  const button = page.getByRole("button", { name: "Menu" });
  await button.click();
  const sheet = page.getByRole("dialog", { name: "Menu" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Developers" })).toHaveAttribute("aria-current", "page");
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  expect(await sheet.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(button).toBeFocused();
});

test("the developers' page lists its sections, and marks the one being read", async ({ page }) => {
  await page.goto("/developers/");
  const sub = page.getByRole("navigation", { name: "On this page" });
  await sub.getByRole("link", { name: "Journal" }).click();
  await expect(page).toHaveURL(/#journal$/);
  await expect(sub.getByRole("link", { name: "Journal" })).toHaveAttribute("data-active", "");
});

test("Nestor answers in the hero: it listens, then speaks", async ({ page }) => {
  await page.goto("/");
  const nestor = page.locator("#hero-nestor");
  await expect(nestor).toHaveAttribute("data-state", "listening", { timeout: 4000 });
  await expect(nestor).toHaveAttribute("data-state", "speaking", { timeout: 6000 });
  await expect(page.locator("[data-hero-stage]")).toHaveAttribute("data-phase", "say");
});

/* No content runs out of its box: a block whose content is wider than itself must scroll on its
   own (code, wide diagrams), never spill over its neighbours. Page-level scroll alone misses it. */
const BOXED = [...PAGES.map((p) => p.path), "/docs/", "/fr/docs/satellites/protocol/", "/docs/sdks/rust/"];
for (const path of BOXED) {
  for (const width of WIDTHS) {
    test(`${path} at ${width}px: no content overflows its box`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await page.addStyleTag({ content: ".section{content-visibility:visible!important}" });
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

test("integrations not shipped yet say so, on both pages", async ({ page }) => {
  for (const path of ["/", "/developers/"]) {
    await page.goto(path);
    const list = page.locator(".integrations");
    await expect(list.getByRole("listitem").filter({ hasText: "WhatsApp" })).toContainText("planned");
    await expect(list.getByRole("listitem").filter({ hasText: "Telegram" })).not.toContainText("planned");
  }
});
