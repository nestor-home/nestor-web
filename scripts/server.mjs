/**
 * What the site serves from the published server package (nestor-home on PyPI), at the version
 * pinned below. Before `astro dev` and `astro build`, the package is run through uvx and its files
 * land in public/ (git-ignored):
 *
 * - the satellite protocol's JSON Schemas, where their `$id` points
 *   (https://nestorhome.dev/schemas/satellite/<version>/<message>.json), so the protocol version
 *   is the one the schemas declare;
 * - the OAuth relay page, the admin's default `relay_url` (https://nestorhome.dev/redirect/oauth),
 *   as /redirect/oauth.html and its script /redirect/relay.js; deploy/nginx.conf serves the page at
 *   that exact URL.
 *
 * Raise NESTOR_SERVER when a server release changes the protocol or the relay page.
 */
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The nestor-home release (PyPI) whose files the site serves. */
export const NESTOR_SERVER = "0.7.0";

const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const SCHEMAS = join(PUBLIC, "schemas");
/** Where the relay's files are served: the page at /redirect/oauth, its script beside it. */
const RELAY = join(PUBLIC, "redirect");
/** The relay's files, as the package ships them (the page loads `relay.js` relatively). */
const RELAY_FILES = ["oauth.html", "relay.js"];

/** Runs `args` with the pinned server package installed (uvx) and returns its standard output. */
function server(args, what) {
  const run = spawnSync("uvx", ["--from", `nestor-home==${NESTOR_SERVER}`, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (run.error?.code === "ENOENT")
    throw new Error(
      "uv is required to build the site: it takes the protocol's JSON Schemas and the OAuth relay page from the server package (https://docs.astral.sh/uv/).",
    );
  if (run.error) throw run.error;
  if (run.status !== 0)
    throw new Error(`nestor-home==${NESTOR_SERVER} could not ${what}:\n${run.stderr || run.stdout}`);
  return run.stdout;
}

/** Generates the schemas and writes each one under public/ at its `$id`'s path. */
export function writeSchemas(site, log = console) {
  const generated = mkdtempSync(join(tmpdir(), "nestor-schemas-"));
  try {
    server(["nestor", "satellites", "schemas", "--out", generated], "write the schemas");
    const files = readdirSync(generated).filter((f) => f.endsWith(".json"));
    if (files.length === 0) throw new Error(`nestor-home==${NESTOR_SERVER} wrote no schema`);
    rmSync(SCHEMAS, { recursive: true, force: true });
    const paths = new Set();
    for (const file of files) {
      const text = readFileSync(join(generated, file), "utf8");
      const id = JSON.parse(text).$id;
      const url = typeof id === "string" ? new URL(id) : null;
      if (url?.origin !== new URL(site).origin || !url.pathname.startsWith("/schemas/"))
        throw new Error(`${file}: its $id (${id}) is not under ${site}/schemas/`);
      const target = join(PUBLIC, url.pathname);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, text);
      paths.add(dirname(url.pathname));
    }
    log.info(`${files.length} schemas from nestor-home==${NESTOR_SERVER} → ${[...paths].join(", ")}`);
  } finally {
    rmSync(generated, { recursive: true, force: true });
  }
}

/** Copies the package's OAuth relay page and script, unchanged, into public/redirect/. */
export function writeRelay(log = console) {
  const source = server(
    [
      "python",
      "-c",
      "import pathlib, nestor.admin; print(pathlib.Path(nestor.admin.__file__).parent / 'static' / 'relay')",
    ],
    "locate the OAuth relay page",
  ).trim();
  rmSync(RELAY, { recursive: true, force: true });
  mkdirSync(RELAY, { recursive: true });
  for (const file of RELAY_FILES) cpSync(join(source, file), join(RELAY, file));
  log.info(`OAuth relay from nestor-home==${NESTOR_SERVER} → /redirect/oauth`);
}

/** @returns {import("astro").AstroIntegration} */
export function serverFiles() {
  return {
    name: "nestor-server-files",
    hooks: {
      "astro:config:setup": ({ command, config, logger }) => {
        if (command !== "dev" && command !== "build") return;
        writeSchemas(config.site, logger);
        writeRelay(logger);
      },
    },
  };
}
