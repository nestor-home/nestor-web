/**
 * Copies the code examples shown on the site from the SDK READMEs (sibling checkouts), so the site
 * never shows code the SDKs don't document. Run after an SDK's README changed:
 *   node scripts/sync-snippets.mjs [path/to/parent/of/the/sdk/repositories]
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const parent = resolve(process.argv[2] ?? join(here, "..", ".."));
const out = join(here, "..", "src", "data", "snippets");
mkdirSync(out, { recursive: true });

/** [README, fenced language, which block, output name] */
const SOURCES = [
  ["nestor-satellite-python/README.md", "python", 0, "python"],
  ["nestor-satellite-typescript/README.md", "ts", 0, "typescript"],
  ["nestor-satellite-rust/README.md", "rust", 0, "rust"],
];

for (const [readme, lang, index, name] of SOURCES) {
  const text = readFileSync(join(parent, readme), "utf8");
  const blocks = [...text.matchAll(new RegExp(`\`\`\`${lang}\\n([\\s\\S]*?)\`\`\``, "g"))].map((m) => m[1]);
  const block = blocks[index];
  if (!block) throw new Error(`${readme}: no \`\`\`${lang} block #${index}`);
  writeFileSync(join(out, `${name}.snippet`), block);
  console.log(`${name}.snippet ← ${readme}`);
}

/* the protocol's JSON Schemas, served where their `$id` says (nestor.mathislambert.fr/schemas/…) */

const schemas = join(parent, "nestor", "src", "nestor", "modules", "satellites", "schemas");
const served = join(here, "..", "public", "schemas", "satellite", "1");
mkdirSync(served, { recursive: true });
for (const file of readdirSync(schemas).filter((f) => f.endsWith(".json")))
  copyFileSync(join(schemas, file), join(served, file));
console.log(`schemas → public/schemas/satellite/1/`);
