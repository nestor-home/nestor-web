import { expect, type Page, test } from "@playwright/test";
import { axe, watch } from "./helpers";

/** Every page of the documentation in a language, as its sidebar lists them. */
async function pagesOf(page: Page, root: string): Promise<string[]> {
  await page.goto(root);
  const hrefs = await page
    .locator("aside.docs-side nav a")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  return [...new Set(hrefs)];
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
  await page.goto("/docs/quickstart/");
  const first = page.locator(".doc-prose .doc-code").first();
  await first.getByRole("button", { name: "Copy" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("uv tool install nestor-home");
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
  "/docs/models/",
  "/docs/agent/",
  "/fr/docs/agent/memory/",
  "/fr/docs/install/",
  "/docs/satellites/protocol/",
  "/fr/docs/sdks/typescript/",
]) {
  test(`${path} has no WCAG 2 A/AA violation (axe)`, async ({ page }) => {
    await page.goto(path);
    expect(await axe(page)).toEqual([]);
  });
}

test("a provider mosaic shows one provider's setup at a time, chosen by click, keys or address", async ({ page }) => {
  await page.goto("/docs/models/");
  const models = page.getByRole("tablist", { name: "Language models" });
  await expect(models.getByRole("tab", { name: "OpenRouter" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#model-openrouter-panel")).toContainText("MODEL_API_KEY=");
  await expect(page.locator("#model-ollama-panel")).toBeHidden();

  await models.getByRole("tab", { name: /Ollama/ }).click();
  await expect(page.locator("#model-ollama-panel")).toContainText("http://localhost:11434/v1");
  await expect(page.locator("#model-openrouter-panel")).toBeHidden();
  await expect(page).toHaveURL(/#model-ollama$/);

  await page.keyboard.press("ArrowRight");
  await expect(models.getByRole("tab", { name: /LM Studio/ })).toBeFocused();
  await expect(page.locator("#model-lm-studio-panel")).toBeVisible();

  await page.goto("/fr/docs/channels/#speech-whisper");
  const speech = page.getByRole("tablist", { name: "Fournisseurs de parole" });
  await expect(speech.getByRole("tab", { name: /Whisper/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#speech-whisper-panel")).toContainText("Whisper est prévu");
  await expect(page.locator("#speech-elevenlabs-panel")).toBeHidden();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the provider mosaics show the default setups", async ({ page }) => {
    await page.goto("/docs/models/");
    await expect(page.locator("#model-openrouter-panel")).toBeVisible();
    await expect(page.locator("#model-openai-panel")).toBeHidden();
    await page.goto("/docs/channels/");
    await expect(page.locator("#speech-elevenlabs-panel")).toBeVisible();
    await expect(page.locator("#channel-chat-panel")).toBeVisible();
    await expect(page.locator("#channel-telegram-panel")).toBeHidden();
  });
});

test("the former providers' page leads to the models", async ({ request }) => {
  for (const [from, to] of [
    ["/docs/providers/", "/docs/models/"],
    ["/fr/docs/providers/", "/fr/docs/models/"],
  ]) {
    expect(await (await request.get(from ?? "")).text()).toContain(`url=${to}`);
  }
});

test("the installation shows one way at a time, Docker opened by its address", async ({ page }) => {
  await page.goto("/docs/install/");
  await expect(page.locator("#install-uv-panel")).toContainText("uv tool install");
  await expect(page.locator("#install-docker-panel")).toBeHidden();
  await page.getByRole("tab", { name: "pip" }).click();
  await expect(page.locator("#install-pip-panel")).toContainText("python3 -m venv");
  await expect(page).toHaveURL(/#install-pip$/);
  await page.goto("/fr/docs/install/#install-docker");
  await expect(page.getByRole("tab", { name: "Docker" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#install-docker-panel")).toContainText("docker run -d");
  await expect(page.locator("#install-uv-panel")).toBeHidden();
});
