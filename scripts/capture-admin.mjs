/**
 * Captures the real Nestor admin, running on its mock API, for the site: high-DPI screenshots and
 * short screen recordings, in both themes and both languages. Raw output goes to `.media-raw/`;
 * `scripts/encode-media.mjs` turns it into what the site ships.
 *
 *   cd ../nestor/web && pnpm dev --port 5190 --strictPort   # the admin on its mocks
 *   node scripts/capture-admin.mjs                          # everything
 *   ONLY=journal,command THEMES=dark LOCALES=en node scripts/capture-admin.mjs
 *
 * Env: ADMIN_URL (default http://localhost:5190), ONLY (shots/clips names), THEMES, LOCALES.
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RAW = join(ROOT, ".media-raw");
const BASE = process.env.ADMIN_URL ?? "http://localhost:5190";
const list = (name, all) => (process.env[name] ? process.env[name].split(",") : all);
const THEMES = list("THEMES", ["light", "dark"]);
const LOCALES = list("LOCALES", ["en", "fr"]);
const ONLY = process.env.ONLY?.split(",");
const wanted = (name) => !ONLY || ONLY.includes(name);

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** A fresh context (fresh mock database) in a theme and a language, signed in as Mathis. */
async function open(browser, { theme, locale, viewport = DESKTOP, scale = 2, mobile = false }) {
  const context = await browser.newContext({
    viewport,
    // `null`: the browser was launched with --force-device-scale-factor (recordings)
    ...(scale ? { deviceScaleFactor: scale } : {}),
    colorScheme: theme,
    locale: locale === "en" ? "en-US" : "fr-FR",
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "no-preference",
  });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem("nestor.theme", t);
    } catch {}
  }, theme);
  // no blinking caret in the captures
  await context.addInitScript(() => {
    const style = () => {
      const s = document.createElement("style");
      s.textContent = "*{caret-color:transparent!important}";
      document.head.append(s);
    };
    if (document.head) style();
    else document.addEventListener("DOMContentLoaded", style);
  });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") console.warn(`  [console] ${m.text()}`);
  });
  await page.goto(`${BASE}/`);
  await settle(page);
  if (locale === "en") {
    const status = await page.evaluate(async () => {
      const r = await fetch("/api/v1/me/locale", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": "mock-csrf-token" },
        body: JSON.stringify({ locale: "en" }),
      });
      return r.status;
    });
    if (status !== 200) throw new Error(`locale switch failed: ${status}`);
    await page.reload();
    await settle(page);
  }
  const lang = await page.evaluate(() => document.documentElement.lang);
  if (lang !== locale) throw new Error(`expected lang ${locale}, got ${lang}`);
  return { context, page };
}

async function settle(page, extra = 400) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  // no skeleton left on screen
  await page.waitForFunction(() => !document.querySelector(".loading-row"), null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(extra);
}

async function go(page, path) {
  await page.goto(`${BASE}${path}`);
  await settle(page);
}

/** Moves the pointer smoothly to the centre of a locator, like a person would. */
async function glide(page, locator, steps = 28) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("nothing to glide to");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  await page.waitForTimeout(180);
}

async function click(page, locator) {
  await glide(page, locator);
  await locator.click();
}

async function type(page, text, delay = 85) {
  await page.keyboard.type(text, { delay });
}

// -- screenshots -----------------------------------------------------------------------------------

const SHOTS = {
  async home(page) {
    await go(page, "/");
  },
  async journal(page) {
    // the parcel watch of Léa as one chain: created, triggered, triaged, decided (with why), delivered
    await go(page, "/journal?watch=w-9d41");
    const heading = page.getByText(/(Veille|Watch) · /).first();
    await heading.evaluate((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top, behavior: "instant" });
    });
    await settle(page, 500);
  },
  async connection(page) {
    await go(page, "/connections/c-mcp-ha/tools");
  },
  async satellites(page) {
    await go(page, "/satellites");
    const approve = page.getByRole("button", { name: /^(Approuver|Approve)…?$/ }).first();
    await approve.click();
    await page.getByRole("dialog").waitFor();
    // the code the device shows (the mocks pair with 424242), typed as a person would
    await page.getByRole("dialog").getByRole("textbox").first().click();
    await type(page, "424242", 30);
    await settle(page, 600);
  },
  async system(page) {
    await go(page, "/system");
  },
};

// -- recordings ------------------------------------------------------------------------------------

/**
 * Each clip returns the moment (ms since the recording started) where the meaningful part begins,
 * so the encoder trims the sign-in and loading before it.
 */
const CLIPS = {
  async "journal-live"(page, { clock }) {
    await go(page, "/journal");
    await page.mouse.move(900, 500);
    const start = clock();
    await page.waitForTimeout(700);
    // the mock stream sends a line every nine seconds: wait for the next one to land at the top
    const first = page.locator("[data-journal-entry]").first();
    const before = await first.textContent();
    await page
      .waitForFunction((b) => document.querySelector("[data-journal-entry]")?.textContent !== b, before, {
        timeout: 12000,
      })
      .catch(() => {});
    const arrived = clock();
    await page.waitForTimeout(1600);
    // then the parcel chain: filter on the watch and open why it spoke
    await go(page, "/journal?watch=w-9d41");
    const heading = page.getByText(/(Veille|Watch) · /).first();
    await page.waitForTimeout(500);
    await heading.evaluate((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top, behavior: "smooth" });
    });
    await page.waitForTimeout(1200);
    const target = page
      .locator("[data-journal-entry]")
      .filter({ hasText: /(why|pourquoi)/ })
      .first();
    await click(page, target);
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(2600);
    // trim the dead wait before the live line (keep ~1.5 s of context)
    return { start, cut: [start + 1500, Math.max(start + 1500, arrived - 1500)] };
  },
  async "journal-filters"(page, { clock }) {
    await go(page, "/journal");
    await page.mouse.move(700, 600);
    const start = clock();
    await page.waitForTimeout(600);
    await click(page, page.getByRole("button", { name: /^(Personne|Person)/ }).first());
    await page.waitForTimeout(700);
    const dialog = page.getByRole("dialog").last();
    await click(page, dialog.locator("[cmdk-item]").filter({ hasText: "Léa" }).first());
    await page.keyboard.press("Escape");
    await settle(page, 900);
    await click(page, page.getByRole("button", { name: /^(Canal|Channel)/ }).first());
    await page.waitForTimeout(700);
    const channels = page.getByRole("dialog").last();
    await click(
      page,
      channels
        .locator("[cmdk-item]")
        .filter({ hasText: /telegram/i })
        .first(),
    );
    await page.keyboard.press("Escape");
    await settle(page, 600);
    await page.mouse.move(800, 700, { steps: 20 });
    await page.mouse.wheel(0, 380);
    await page.waitForTimeout(1800);
    return { start };
  },
  async command(page, { clock }) {
    await go(page, "/");
    await page.mouse.move(1100, 300);
    const start = clock();
    await page.waitForTimeout(800);
    await page.keyboard.press("ControlOrMeta+k");
    await page.waitForTimeout(700);
    await type(page, "satell");
    await page.waitForTimeout(700);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(350);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await settle(page, 1200);
    await page.keyboard.press("ControlOrMeta+k");
    await page.waitForTimeout(500);
    await type(page, "journal");
    await page.waitForTimeout(600);
    await page.keyboard.press("Enter");
    await settle(page, 1800);
    return { start };
  },
  async mobile(page, { clock }) {
    // touch emulation ignores the wheel: scroll the document the way a flick would
    const flick = (dy) => page.evaluate((y) => window.scrollBy({ top: y, behavior: "smooth" }), dy);
    // warm the journal's data first, so the recorded navigation shows no skeleton
    await go(page, "/journal");
    await page
      .getByRole("button", { name: /(menu|Menu|navigation|Navigation|Ouvrir|Open)/ })
      .first()
      .tap();
    await page.waitForTimeout(500);
    await page
      .getByRole("link", { name: /^(Today|Aujourd’hui|Aujourd'hui)$/ })
      .last()
      .tap();
    await settle(page, 800);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(300);
    const start = clock();
    await page.waitForTimeout(900);
    await flick(520);
    await page.waitForTimeout(1300);
    await flick(-520);
    await page.waitForTimeout(900);
    const menu = page.getByRole("button", { name: /(menu|Menu|navigation|Navigation|Ouvrir|Open)/ }).first();
    await menu.tap();
    await page.waitForTimeout(900);
    await page.getByRole("link", { name: "Journal" }).last().tap();
    await settle(page, 1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(500);
    await flick(640);
    await page.waitForTimeout(1500);
    const entry = page.locator("[data-journal-entry]").nth(3);
    await entry.tap();
    await page.waitForTimeout(2200);
    return { start };
  },
};

/**
 * Records a page at its device pixels through the DevTools screencast (Playwright's own video is
 * capped at CSS pixels): one JPEG per painted frame, with its arrival time, for the encoder.
 */
async function screencast(page, dir, scale) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const session = await page.context().newCDPSession(page);
  const frames = [];
  const writes = [];
  const t0 = Date.now();
  session.on("Page.screencastFrame", ({ data, sessionId }) => {
    const at = Date.now() - t0;
    const file = `${String(frames.length).padStart(5, "0")}.jpg`;
    frames.push({ file, at });
    writes.push(writeFile(join(dir, file), Buffer.from(data, "base64")));
    session.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  const { width, height } = page.viewportSize();
  await session.send("Page.startScreencast", {
    format: "jpeg",
    quality: 95,
    maxWidth: Math.round(width * scale),
    maxHeight: Math.round(height * scale),
    everyNthFrame: 1,
  });
  return {
    clock: () => Date.now() - t0,
    count: () => frames.length,
    async stop() {
      const end = Date.now() - t0;
      await session.send("Page.stopScreencast").catch(() => {});
      await Promise.all(writes);
      await writeFile(join(dir, "frames.json"), JSON.stringify({ end, frames }, null, 1));
    },
  };
}

async function main() {
  await mkdir(RAW, { recursive: true });
  const browser = await chromium.launch();
  const timings = {};
  try {
    for (const theme of THEMES) {
      for (const locale of LOCALES) {
        for (const [name, shoot] of Object.entries(SHOTS)) {
          if (!wanted(name)) continue;
          const { context, page } = await open(browser, { theme, locale });
          try {
            await shoot(page);
            await page.mouse.move(0, 0);
            await page.screenshot({ path: join(RAW, `shot-${name}-${theme}-${locale}.png`) });
            console.log(`shot ${name} ${theme} ${locale}`);
          } catch (error) {
            console.error(`shot ${name} ${theme} ${locale} failed:`, error.message);
          } finally {
            await context.close();
          }
        }
        for (const [name, record] of Object.entries(CLIPS)) {
          if (!wanted(name)) continue;
          const mobile = name === "mobile";
          // the DevTools screencast only paints at device pixels when the scale is forced at launch
          const launched = await chromium.launch({ args: [`--force-device-scale-factor=${mobile ? 3 : 2}`] });
          const { context, page } = await open(launched, {
            theme,
            locale,
            mobile,
            viewport: mobile ? MOBILE : DESKTOP,
            scale: null,
          });
          const id = `${name}-${theme}-${locale}`;
          const recorder = await screencast(page, join(RAW, `frames-${id}`), mobile ? 3 : 2);
          const clock = recorder.clock;
          try {
            const marks = await record(page, { clock });
            marks.end = clock();
            await recorder.stop();
            timings[id] = marks;
            console.log(`clip ${id}`, marks, `${recorder.count()} frames`);
          } catch (error) {
            await recorder.stop();
            console.error(`clip ${id} failed:`, error.message);
          } finally {
            await context.close();
            await launched.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
  // merge with earlier timings so partial runs keep the others
  const path = join(RAW, "timings.json");
  let previous = {};
  try {
    previous = JSON.parse(await readFile(path, "utf8"));
  } catch {}
  await writeFile(path, JSON.stringify({ ...previous, ...timings }, null, 2));
  console.log("raw files:", (await readdir(RAW)).length);
}

await main();
