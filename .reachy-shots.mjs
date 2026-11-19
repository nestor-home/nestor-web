import { chromium } from "@playwright/test";

const out = process.argv[2];
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(process.argv[3] ?? "http://localhost:4330/fr/");
const tile = page.locator("#reachy .tile");
await tile.scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
for (const [i, at] of [
  [1, 1800],
  [2, 2600],
  [3, 2600],
  [4, 2600],
]) {
  await page.waitForTimeout(at);
  const state = await page.locator("[data-reachy]").getAttribute("data-state");
  await tile.screenshot({ path: `${out}/reachy-${i}-${state}.png` });
}
console.log(JSON.stringify(errors));
await browser.close();
