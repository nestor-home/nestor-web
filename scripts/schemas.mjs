/**
 * The satellite protocol's JSON Schemas, served where their `$id` points
 * (https://nestor.mathislambert.fr/schemas/satellite/<version>/<message>.json).
 *
 * They come from the published server package, at the version pinned below: before `astro dev`
 * and `astro build`, `nestor satellites schemas` writes them (through uvx) and each file lands in
 * public/ at its `$id`'s path, so the protocol version is the one the schemas declare. Raise
 * NESTOR_SERVER when a server release changes the protocol.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The nestor-home release (PyPI) whose schemas the site serves. */
export const NESTOR_SERVER = "0.0.2";

const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const SERVED = join(PUBLIC, "schemas");

/** Generates the schemas and writes each one under public/ at its `$id`'s path. */
export function writeSchemas(site, log = console) {
  const generated = mkdtempSync(join(tmpdir(), "nestor-schemas-"));
  try {
    const run = spawnSync(
      "uvx",
      ["--from", `nestor-home==${NESTOR_SERVER}`, "nestor", "satellites", "schemas", "--out", generated],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    if (run.error?.code === "ENOENT")
      throw new Error(
        "uv is required to build the site: it generates the protocol's JSON Schemas (https://docs.astral.sh/uv/).",
      );
    if (run.error) throw run.error;
    if (run.status !== 0)
      throw new Error(`nestor-home==${NESTOR_SERVER} could not write the schemas:\n${run.stderr || run.stdout}`);

    const files = readdirSync(generated).filter((f) => f.endsWith(".json"));
    if (files.length === 0) throw new Error(`nestor-home==${NESTOR_SERVER} wrote no schema`);
    rmSync(SERVED, { recursive: true, force: true });
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

/** @returns {import("astro").AstroIntegration} */
export function protocolSchemas() {
  return {
    name: "nestor-protocol-schemas",
    hooks: {
      "astro:config:setup": ({ command, config, logger }) => {
        if (command === "dev" || command === "build") writeSchemas(config.site, logger);
      },
    },
  };
}
