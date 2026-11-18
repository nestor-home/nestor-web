/**
 * Captures the real Nestor admin, running on its mock API, for the site: high-DPI screenshots in
 * both themes and both languages. Raw output goes to `.media-raw/`; `scripts/encode-media.mjs`
 * turns it into what the site ships.
 *
 *   cd ../nestor/web && pnpm dev --port 5190 --strictPort   # the admin on its mocks
 *   node scripts/capture-admin.mjs                          # everything
 *   ONLY=journal THEMES=dark LOCALES=en node scripts/capture-admin.mjs
 *
 * Env: ADMIN_URL (default http://localhost:5190), ONLY (shots' names), THEMES, LOCALES,
 * BROWSER_CHANNEL (e.g. `chrome`: the installed browser instead of Playwright's own).
 */
import { mkdir } from "node:fs/promises";
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
const CHANNEL = process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {};

/** A fresh context (fresh mock database) in a theme and a language, signed in as Mathis. */
async function open(browser, { theme, locale }) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: theme,
    locale: locale === "en" ? "en-US" : "fr-FR",
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
  // the account's language: the admin and the mock household's texts follow it
  const status = await page.evaluate(async (l) => {
    const r = await fetch("/api/v1/me/locale", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": "mock-csrf-token" },
      body: JSON.stringify({ locale: l }),
    });
    return r.status;
  }, locale);
  if (status !== 200) throw new Error(`locale switch failed: ${status}`);
  await page.reload();
  await settle(page);
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

const SHOTS = {
  // the four spaces the home page shows, one per moment of the story
  async today(page) {
    await go(page, "/");
  },
  async ongoing(page) {
    await go(page, "/activity");
  },
  async house(page) {
    await go(page, "/house");
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
};

async function main() {
  await mkdir(RAW, { recursive: true });
  const browser = await chromium.launch(CHANNEL);
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
      }
    }
  } finally {
    await browser.close();
  }
}

await main();
