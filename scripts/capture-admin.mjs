/**
 * Captures the Nestor admin, running on its mock API (a fictional household), for the docs: one picture per screen
 * the docs show, in both themes and both languages, as WebP in `public/docs/admin/<name>-<theme>-<locale>.webp`
 * (shown by the docs' `<AdminShot>`). Needs `cwebp` (libwebp) on the PATH.
 *
 *   cd ../nestor/web && pnpm dev --port 5180      # the admin on its mocks
 *   node scripts/capture-admin.mjs                # everything
 *   ONLY=journal THEMES=dark LOCALES=en node scripts/capture-admin.mjs
 *
 * Env: ADMIN_URL (default http://localhost:5180), ONLY (shots' names), THEMES, LOCALES,
 * BROWSER_CHANNEL (e.g. `chrome`: the installed browser instead of Playwright's own), OUT (another folder).
 */
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = process.env.OUT ?? join(ROOT, "public/docs/admin");
const BASE = process.env.ADMIN_URL ?? "http://localhost:5180";
const list = (name, all) => (process.env[name] ? process.env[name].split(",") : all);
const THEMES = list("THEMES", ["light", "dark"]);
const LOCALES = list("LOCALES", ["en", "fr"]);
const ONLY = process.env.ONLY?.split(",");
const CHANNEL = process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {};

/** A fresh context (fresh mock database) in a theme and a language. */
async function open(browser, { theme, locale }) {
  const context = await browser.newContext({
    viewport: { width: 1360, height: 850 },
    deviceScaleFactor: 2,
    colorScheme: theme,
    locale: locale === "en" ? "en-US" : "fr-FR",
    reducedMotion: "reduce",
  });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem("nestor.theme", t);
    } catch {}
  }, theme);
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
  return { context, page };
}

async function settle(page, extra = 500) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(extra);
}

const go = async (page, path) => {
  await page.goto(`${BASE}${path}`);
  await settle(page);
};

/** Each screen the docs show, and where it is in the admin. */
export const SHOTS = {
  today: (page) => go(page, "/"),
  talk: (page) => go(page, "/chat"),
  ongoing: (page) => go(page, "/activity"),
  memories: (page) => go(page, "/memories"),
  journal: (page) => go(page, "/journal"),
  house: (page) => go(page, "/house"),
  connections: (page) => go(page, "/connections/catalogue"),
  models: (page) => go(page, "/config/models"),
  satellites: (page) => go(page, "/satellites"),
  system: (page) => go(page, "/system"),
};

async function main() {
  await mkdir(OUT, { recursive: true });
  const raw = await mkdtemp(join(tmpdir(), "nestor-admin-"));
  const browser = await chromium.launch(CHANNEL);
  try {
    for (const theme of THEMES) {
      for (const locale of LOCALES) {
        const { context, page } = await open(browser, { theme, locale });
        try {
          for (const [name, shoot] of Object.entries(SHOTS)) {
            if (ONLY && !ONLY.includes(name)) continue;
            await shoot(page);
            await page.mouse.move(0, 0);
            const png = join(raw, `${name}.png`);
            await page.screenshot({ path: png });
            // 1600 px wide: sharp on a high-density screen, light in the page
            execFileSync("cwebp", [
              "-quiet",
              "-q",
              "80",
              "-resize",
              "1600",
              "0",
              png,
              "-o",
              join(OUT, `${name}-${theme}-${locale}.webp`),
            ]);
            console.log(`${name} ${theme} ${locale}`);
          }
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
    await rm(raw, { recursive: true, force: true });
  }
}

await main();
