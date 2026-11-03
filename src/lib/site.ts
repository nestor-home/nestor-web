/** Facts about the project that are not words: addresses, repositories, commands. */

import GUIDE from "@/content/docs/en/install.mdx?raw";
import START from "@/content/docs/en/quickstart.md?raw";
import { firstCodeBlock } from "@/lib/docs";

export const ORG = "https://github.com/nestor-home";

export const REPOS = {
  nestor: `${ORG}/nestor`,
  python: `${ORG}/nestor-satellite-python`,
  typescript: `${ORG}/nestor-satellite-typescript`,
  rust: `${ORG}/nestor-satellite-rust`,
  reachy: `${ORG}/nestor-reachy`,
  web: `${ORG}/nestor-web`,
} as const;

export const ROADMAP_URL = `${REPOS.nestor}#readme`;

/** Every `bash` block of a documentation section (from its heading to the next), as its commands. */
function blocks(page: string, heading: string): string[][] {
  const at = page.indexOf(heading);
  if (at < 0) throw new Error(`[site] no "${heading}" in the documentation`);
  let rest = page.slice(at + heading.length);
  const next = rest.search(/^## /m);
  if (next >= 0) rest = rest.slice(0, next);
  const found: string[][] = [];
  for (let block = firstCodeBlock(rest, "bash"); block; block = firstCodeBlock(rest, "bash")) {
    found.push(
      block
        .split("\n")
        .map((line) => line.replace(/(^|\s+)#.*$/, "").trim())
        .filter(Boolean),
    );
    rest = rest.slice(rest.indexOf(block) + block.length);
  }
  return found;
}

/** The shortest install, as the documentation's quickstart gives it (src/content/docs/en/quickstart.md). */
export const INSTALL: readonly string[] = blocks(START, "## Run the server").flat();

/** The steps of the quickstart with Docker, and how many of the documentation's commands each takes. */
const STEPS = [
  ["qs-1", 1],
  ["qs-2", 1],
  ["qs-3", 1],
] as const;
const DOCKER = blocks(GUIDE, '<Tab set="install" choice="docker">')[0] ?? [];
if (STEPS.reduce((sum, [, n]) => sum + n, 0) !== DOCKER.length)
  throw new Error("[site] the quickstart's steps no longer cover the documentation's Docker commands");

/** The quickstart with Docker, as the install page gives it in its Docker tab (src/content/docs/en/install.mdx). */
export const QUICKSTART: readonly { id: string; command: string }[] = STEPS.map(([id, n], i) => {
  const from = STEPS.slice(0, i).reduce((sum, [, size]) => sum + size, 0);
  return { id, command: DOCKER.slice(from, from + n).join(" && ") };
});

/** The home page's quick install: the first commands of each way, as the documentation gives them. */
export const QUICK_INSTALL: readonly { id: string; label: string; command: string }[] = [
  { id: "uv", label: "uv", command: INSTALL.join("\n") },
  {
    id: "docker",
    label: "Docker",
    // the documentation's docker run commands, without the editor opened on the keys
    command: DOCKER.filter((line) => !line.startsWith("$EDITOR")).join("\n"),
  },
];

export const ADMIN_URL = "http://localhost:8470";
