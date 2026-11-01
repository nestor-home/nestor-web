import { createRequire } from "node:module";
import { expect, type Page, test } from "@playwright/test";

const require = createRequire(import.meta.url);

/** Every page of the documentation in a language, as its sidebar lists them. */
async function pagesOf(page: Page, root: string): Promise<string[]> {
  await page.goto(root);
  const hrefs = await page
    .locator("aside.docs-side nav a")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  return [...new Set(hrefs)];
}

function watch(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(String(e)));
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  return problems;
}

test("both languages hold the same pages, each with its title, text and the other language", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const en = await pagesOf(page, "/docs/");
  const fr = await pagesOf(page, "/fr/docs/");
  expect(en.length).toBeGreaterThanOrEqual(10);
  expect(fr).toEqual(en.map((path) => `/fr${path}`));
  for (const [path, lang] of [...en.map((p) => [p, "en"]), ...fr.map((p) => [p, "fr"])] as [string, string][]) {
    const problems = watch(page);
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
    await expect(page.locator(".doc-prose p").first()).toBeVisible();
    await expect(page.locator(`link[rel="alternate"][hreflang="${lang === "en" ? "fr" : "en"}"]`)).toHaveAttribute(
      "href",
      new RegExp(`${lang === "en" ? `/fr${path}` : path.replace(/^\/fr/, "")}$`),
    );
    expect(problems, path).toEqual([]);
  }
});

test("every link of the documentation leads somewhere, anchors included", async ({ page, request }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const pages = [...(await pagesOf(page, "/docs/")), ...(await pagesOf(page, "/fr/docs/"))];
  const targets = new Map<string, string>();
  for (const path of pages) {
    await page.goto(path);
    const hrefs = await page
      .locator("main a[href]")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
    for (const href of hrefs) {
      if (href.startsWith("http")) continue;
      targets.set(new URL(href, `http://site${path}`).href.replace("http://site", ""), path);
    }
  }
  const broken: string[] = [];
  const ids = new Map<string, Set<string>>();
  for (const [target, from] of targets) {
    const [path = "", hash] = target.split("#");
    if (!ids.has(path)) {
      const response = await request.get(path);
      if (response.status() !== 200) {
        broken.push(`${from} → ${target} (${response.status()})`);
        continue;
      }
      const html = await response.text();
      ids.set(path, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1] ?? "")));
    }
    if (hash && !ids.get(path)?.has(decodeURIComponent(hash))) broken.push(`${from} → ${target} (no #${hash})`);
  }
  expect(targets.size).toBeGreaterThan(30);
  expect(broken).toEqual([]);
});

for (const path of [
  "/docs/",
  "/docs/providers/",
  "/fr/docs/install/",
  "/docs/satellites/protocol/",
  "/fr/docs/sdks/rust/",
]) {
  for (const width of [390, 768, 1440]) {
    test(`${path} at ${width}px: no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

test("the SDK pages show their code, highlighted, and copy it", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const [sdk, lang, text] of [
    ["python", "python", "Satellite("],
    ["typescript", "ts", "new Satellite("],
    ["rust", "rust", "Satellite::builder("],
  ]) {
    await page.goto(`/docs/sdks/${sdk}/`);
    const block = page.locator(`.doc-prose pre[data-language="${lang}"]`).first();
    await expect(block).toContainText(text ?? "");
    expect(await block.locator("span[style*='--astro-code-token']").count()).toBeGreaterThan(5);
  }
  await page.goto("/docs/");
  const first = page.locator(".doc-prose .doc-code").first();
  await first.getByRole("button", { name: "Copy" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("uv tool install nestor-home\n");
  await expect(first.getByRole("button", { name: "Copied" })).toBeVisible();
});

test("the reader moves to the next page, and to the same page in French", async ({ page }) => {
  await page.goto("/docs/satellites/");
  await page.locator('a[rel="next"]').click();
  await expect(page).toHaveURL(/\/docs\/satellites\/protocol\/$/);
  await expect(page.locator('aside.docs-side a[aria-current="page"]')).toHaveText(/nestor\.satellite\/1/);
  await page.getByRole("link", { name: "Lire cette page en français" }).click();
  await expect(page).toHaveURL(/\/fr\/docs\/satellites\/protocol\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Protocole/);
});

test("on a phone, the pages are one tap away", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/sdks/python/");
  await expect(page.locator("aside.docs-side")).toBeHidden();
  await page.getByText("Pages of the documentation").click();
  await page.locator(".docs-menu").getByRole("link", { name: "Conformance" }).click();
  await expect(page).toHaveURL(/\/docs\/satellites\/conformance\/$/);
});

test("the developers' page points to the documentation and shows its examples", async ({ page }) => {
  await page.goto("/developers/#satellites");
  await expect(page.locator("#satellites").getByRole("tabpanel")).toContainText("Satellite(");
  await page.getByRole("link", { name: "The Python SDK’s documentation" }).click();
  await expect(page).toHaveURL(/\/docs\/sdks\/python\/$/);
});

for (const path of [
  "/docs/",
  "/docs/providers/",
  "/fr/docs/install/",
  "/docs/satellites/protocol/",
  "/fr/docs/sdks/typescript/",
]) {
  test(`${path} has no WCAG 2 A/AA violation (axe)`, async ({ page }) => {
    await page.goto(path);
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

test("the providers' page shows one provider's setup at a time, chosen by click, keys or address", async ({ page }) => {
  await page.goto("/docs/providers/");
  const models = page.getByRole("tablist", { name: "Language models" });
  await expect(models.getByRole("tab", { name: "OpenRouter" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#model-openrouter-setup")).toContainText("OPENROUTER_API_KEY=");
  await expect(page.locator("#model-ollama-setup")).toBeHidden();

  await models.getByRole("tab", { name: /Ollama/ }).click();
  await expect(page.locator("#model-ollama-setup")).toContainText("http://localhost:11434/v1");
  await expect(page.locator("#model-openrouter-setup")).toBeHidden();
  await expect(page).toHaveURL(/#model-ollama$/);

  await page.keyboard.press("ArrowRight");
  await expect(models.getByRole("tab", { name: /LM Studio/ })).toBeFocused();
  await expect(page.locator("#model-lm-studio-setup")).toBeVisible();

  await page.goto("/fr/docs/providers/#speech-whisper");
  const speech = page.getByRole("tablist", { name: "Fournisseurs de parole" });
  await expect(speech.getByRole("tab", { name: /Whisper/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#speech-whisper-setup")).toContainText("Whisper est prévu");
  await expect(page.locator("#speech-elevenlabs-setup")).toBeHidden();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the providers' page shows the default setups", async ({ page }) => {
    await page.goto("/docs/providers/");
    await expect(page.locator("#model-openrouter-setup")).toBeVisible();
    await expect(page.locator("#speech-elevenlabs-setup")).toBeVisible();
    await expect(page.locator("#model-openai-setup")).toBeHidden();
  });
});
