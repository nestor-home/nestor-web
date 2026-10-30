/**
 * Turns the raw captures of `scripts/capture-admin.mjs` (in `.media-raw/`) into what the site ships:
 *   - screenshots → src/assets/captures/{shot}-{theme}-{locale}.webp (full resolution; Astro derives
 *     the AVIF/WebP sizes at build),
 *   - recordings → public/media/{clip}-{theme}-{locale}.{mp4,webm} and a .poster.webp,
 *   - src/data/media.json, the inventory the site renders from (only what exists).
 *
 *   node scripts/encode-media.mjs            # everything found in .media-raw/
 *   ONLY=command node scripts/encode-media.mjs
 *
 * Needs ffmpeg (with libx264 and libvpx-vp9) on PATH, or FFMPEG=/path/to/ffmpeg.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RAW = join(ROOT, ".media-raw");
const CAPTURES = join(ROOT, "src/assets/captures");
const MEDIA = join(ROOT, "public/media");
const DATA = join(ROOT, "src/data/media.json");
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const ONLY = process.env.ONLY?.split(",");
const FPS = 30;

const SHOTS = ["home", "journal", "connection", "satellites", "system"];
// the clips the site shows; `command` and `mobile` are captured too, and encoded with ONLY=command,mobile
const CLIPS = ONLY ?? ["journal-live", "journal-filters"];
const THEMES = ["light", "dark"];
const LOCALES = ["en", "fr"];

const exists = (path) =>
  stat(path)
    .then(() => true)
    .catch(() => false);

const ffmpeg = (args) => execFileSync(FFMPEG, ["-v", "error", "-y", ...args], { stdio: "inherit" });

async function encodeShots() {
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
}

/**
 * The clip's timeline: frames between the `start` and `end` marks, minus the `cut` span (dead
 * waiting), each lasting until the next frame arrives. Returns the concat list and the duration.
 */
function timeline({ frames, end: recorded }, marks) {
  const start = marks.start ?? 0;
  const end = Math.min(marks.end ?? recorded, recorded);
  const [cutFrom, cutTo] = marks.cut ?? [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const shift = (t) => (t >= cutTo ? t - (cutTo - cutFrom) : t);
  const kept = [];
  // the frame on screen when the clip starts, then every frame painted until the end
  const before = frames.filter((f) => f.at <= start).at(-1);
  if (before) kept.push({ file: before.file, at: start });
  for (const f of frames) {
    if (f.at <= start || f.at >= end) continue;
    if (f.at > cutFrom && f.at < cutTo) continue;
    kept.push(f);
  }
  // across the cut, the last frame before it stays until the first after it
  const lines = [];
  for (let i = 0; i < kept.length; i++) {
    const here = shift(kept[i].at);
    const next = i + 1 < kept.length ? shift(kept[i + 1].at) : shift(end);
    const duration = Math.max(0, next - here) / 1000;
    if (duration <= 0) continue;
    lines.push(`file '${kept[i].file}'`, `duration ${duration.toFixed(3)}`);
  }
  if (kept.length) lines.push(`file '${kept.at(-1).file}'`); // the concat demuxer needs the last one twice
  return { list: lines.join("\n"), duration: (shift(end) - start) / 1000, first: kept[0]?.file };
}

async function encodeClips(timings) {
  await mkdir(MEDIA, { recursive: true });
  const inventory = {};
  for (const clip of CLIPS) {
    if (ONLY && !ONLY.includes(clip)) continue;
    if (!["journal-live", "journal-filters", "command", "mobile"].includes(clip)) continue;
    for (const theme of THEMES) {
      for (const locale of LOCALES) {
        const id = `${clip}-${theme}-${locale}`;
        const dir = join(RAW, `frames-${id}`);
        if (!(await exists(join(dir, "frames.json")))) continue;
        const marks = timings[id];
        if (!marks) {
          console.warn(`${id}: no timings, skipped`);
          continue;
        }
        const recording = JSON.parse(await readFile(join(dir, "frames.json"), "utf8"));
        const { list, duration, first } = timeline(recording, marks);
        await writeFile(join(dir, "list.txt"), list);
        const mobile = clip === "mobile";
        // desktop: 2880×1800 device pixels → 1440×900; mobile: 1170×2532 → 780×1688 (2×)
        const [width, height] = mobile ? [780, 1688] : [1440, 900];
        const filters = `fps=${FPS},scale=${width}:${height}:flags=lanczos,format=yuv420p`;
        const input = ["-f", "concat", "-safe", "0", "-i", join(dir, "list.txt")];
        const mp4 = join(MEDIA, `${id}.mp4`);
        const webm = join(MEDIA, `${id}.webm`);
        ffmpeg([
          ...input,
          "-vf",
          filters,
          "-an",
          "-c:v",
          "libx264",
          "-preset",
          "slow",
          "-crf",
          mobile ? "28" : "26",
          "-tune",
          "animation",
          "-movflags",
          "+faststart",
          mp4,
        ]);
        ffmpeg([
          ...input,
          "-vf",
          filters,
          "-an",
          "-c:v",
          "libvpx-vp9",
          "-crf",
          "36",
          "-b:v",
          "0",
          "-row-mt",
          "1",
          "-deadline",
          "good",
          "-cpu-used",
          "2",
          webm,
        ]);
        const poster = join(MEDIA, `${id}.poster.webp`);
        await sharp(join(dir, first)).resize(width, height).webp({ quality: 80 }).toFile(poster);
        const kb = async (f) => `${((await stat(f)).size / 1024).toFixed(0)} KB`;
        console.log(`${id}: ${duration.toFixed(1)} s, mp4 ${await kb(mp4)}, webm ${await kb(webm)}`);
        inventory[clip] ??= { themes: [], locales: [], width, height, duration: 0 };
        const entry = inventory[clip];
        if (!entry.themes.includes(theme)) entry.themes.push(theme);
        if (!entry.locales.includes(locale)) entry.locales.push(locale);
        entry.duration = Math.max(entry.duration, Math.round(duration * 10) / 10);
      }
    }
  }
  return inventory;
}

/** The inventory, rebuilt from what is on disk so partial runs never lose entries. */
async function writeInventory() {
  const shots = [];
  for (const shot of SHOTS) {
    const all = [];
    for (const theme of THEMES)
      for (const locale of LOCALES) all.push(await exists(join(CAPTURES, `${shot}-${theme}-${locale}.webp`)));
    if (all.every(Boolean)) shots.push(shot);
  }
  let previous = {};
  try {
    previous = JSON.parse(await readFile(DATA, "utf8"));
  } catch {}
  const clips = {};
  for (const clip of CLIPS) {
    const themes = [];
    const locales = [];
    for (const theme of THEMES)
      for (const locale of LOCALES)
        if (await exists(join(MEDIA, `${clip}-${theme}-${locale}.mp4`))) {
          if (!themes.includes(theme)) themes.push(theme);
          if (!locales.includes(locale)) locales.push(locale);
        }
    if (!themes.length) continue;
    const mobile = clip === "mobile";
    clips[clip] = {
      themes,
      locales,
      width: mobile ? 780 : 1440,
      height: mobile ? 1688 : 900,
      duration: previous.clips?.[clip]?.duration ?? 0,
    };
  }
  return { shots, clips, ...(previous.twin ? { twin: previous.twin } : {}) };
}

async function main() {
  let timings = {};
  try {
    timings = JSON.parse(await readFile(join(RAW, "timings.json"), "utf8"));
  } catch {}
  await encodeShots();
  const encoded = await encodeClips(timings);
  const inventory = await writeInventory();
  for (const [clip, entry] of Object.entries(encoded)) {
    if (inventory.clips[clip]) inventory.clips[clip].duration = entry.duration;
  }
  await mkdir(join(ROOT, "src/data"), { recursive: true });
  await writeFile(DATA, `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(`inventory: ${DATA}`);
  void readdir;
}

await main();
