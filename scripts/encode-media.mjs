/**
 * Turns the raw screenshots of `scripts/capture-admin.mjs` (in `.media-raw/`) into what the site
 * ships: src/assets/captures/{shot}-{theme}-{locale}.webp, at full resolution (Astro derives the
 * AVIF and WebP sizes at build).
 *
 *   node scripts/encode-media.mjs               # everything found in .media-raw/
 *   ONLY=journal node scripts/encode-media.mjs
 */
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RAW = join(ROOT, ".media-raw");
const CAPTURES = join(ROOT, "src/assets/captures");
const ONLY = process.env.ONLY?.split(",");

// the admin's screens the home page shows (the SHOTS of capture-admin.mjs)
const SHOTS = ["today", "ongoing", "house", "journal"];
const THEMES = ["light", "dark"];
const LOCALES = ["en", "fr"];

const exists = (path) =>
  stat(path)
    .then(() => true)
    .catch(() => false);

await mkdir(CAPTURES, { recursive: true });
for (const shot of SHOTS) {
  if (ONLY && !ONLY.includes(shot)) continue;
  for (const theme of THEMES) {
    for (const locale of LOCALES) {
      const from = join(RAW, `shot-${shot}-${theme}-${locale}.png`);
      if (!(await exists(from))) continue;
      const to = join(CAPTURES, `${shot}-${theme}-${locale}.webp`);
      await sharp(from).webp({ quality: 88, effort: 6 }).toFile(to);
      console.log(`${to} ${((await stat(to)).size / 1024).toFixed(0)} KB`);
    }
  }
}
