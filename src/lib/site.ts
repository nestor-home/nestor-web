/** Facts about the project that are not words: addresses, repositories, commands. */
import START from "@/content/docs/en/index.md?raw";
import GUIDE from "@/content/docs/en/install.md?raw";
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

/** The shortest install, as the documentation's first page gives it (src/content/docs/en/index.md). */
export const INSTALL: readonly string[] = blocks(START, "## The short way").flat();

/** The package and the image, one command each: the home page's quick install. */
export const PACKAGE = "nestor-home";
export const IMAGE = "ghcr.io/nestor-home/nestor";
export const QUICK_INSTALL: readonly { id: string; label: string; command: string }[] = [
  { id: "uv", label: "uv", command: `uv tool install ${PACKAGE}` },
  { id: "pip", label: "pip", command: `pip install ${PACKAGE}` },
  { id: "docker", label: "Docker", command: `docker pull ${IMAGE}` },
];
if (!INSTALL.includes(`uv tool install ${PACKAGE}`) || !GUIDE.includes(IMAGE))
  throw new Error("[site] the quick install no longer matches the documentation");

/** The steps of the quickstart with Docker, and how many of the documentation's commands each takes. */
const STEPS = [
  ["qs-1", 3],
  ["qs-2", 1],
  ["qs-3", 1],
  ["qs-4", 1],
] as const;
const DOCKER = blocks(GUIDE, "## With Docker")[0] ?? [];
if (STEPS.reduce((sum, [, n]) => sum + n, 0) !== DOCKER.length)
  throw new Error("[site] the quickstart's steps no longer cover the documentation's Docker commands");

/** The quickstart with Docker, as the install page gives it (src/content/docs/en/install.md). */
export const QUICKSTART: readonly { id: string; command: string }[] = STEPS.map(([id, n], i) => {
  const from = STEPS.slice(0, i).reduce((sum, [, size]) => sum + size, 0);
  return { id, command: DOCKER.slice(from, from + n).join(" && ") };
});

export const ADMIN_URL = "http://localhost:8470";
