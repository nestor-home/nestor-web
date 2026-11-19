/** Facts about the project that are not words: addresses, repositories, commands. */
import GUIDE from "@/content/docs/en/install.mdx?raw";
import START from "@/content/docs/en/quickstart.md?raw";
import { taggedCommands } from "@/lib/docs";

/** The production origin (astro.config.mjs serves the site there). */
export const SITE = "https://nestorhome.dev";

export const ORG = "https://github.com/nestor-home";

export const REPOS = {
  nestor: `${ORG}/nestor`,
  python: `${ORG}/nestor-satellite-python`,
  typescript: `${ORG}/nestor-satellite-typescript`,
  rust: `${ORG}/nestor-satellite-rust`,
  reachy: `${ORG}/nestor-reachy`,
  web: `${ORG}/nestor-web`,
} as const;

/** The shortest install: the blocks the quickstart tags `quickstart` (src/content/docs/en/quickstart.md). */
export const INSTALL: readonly string[] = taggedCommands(START, "quickstart").flat();
if (INSTALL.length === 0) throw new Error("[site] the quickstart tags no command");

/** The quickstart with Docker: the block the install page tags `docker-quickstart` (src/content/docs/en/install.mdx). */
const [DOCKER = [], ...extra] = taggedCommands(GUIDE, "docker-quickstart");
if (extra.length > 0) throw new Error("[site] the install page tags more than one Docker quickstart block");
if (DOCKER.length === 0) throw new Error("[site] the install page tags no Docker quickstart command");

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

/** A satellite in a few lines, as the Python SDK's README writes one (nestor-satellite-python). */
export const SATELLITE_SNIPPET = `satellite = Satellite(
    "http://nestor.local:8471",
    Manifest.of(Device("salon", "reachy-mini", "salon")),
    tokens=TokenStore("~/.config/nestor/salon.json"),
    source=Microphone(),
    sink=Speaker(),
)
asyncio.run(satellite.run())`;

/** A device's manifest, as the protocol gives it (docs/satellites/protocol, section 5), shortened. */
export const MANIFEST_SNIPPET = `{
  "protocol": "nestor.satellite/1",
  "device": { "id": "salon", "model": "reachy-mini" },
  "capabilities": [
    { "name": "audio.capture" },
    { "name": "audio.playback" },
    { "name": "motion.head" }
  ]
}`;
