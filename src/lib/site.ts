/** Facts about the project that are not words: addresses, repositories, commands. */
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

/** The quickstart, as the compose file of the core describes it (nestor/compose.yaml). */
export const QUICKSTART = [
  { id: "qs-1", command: "git clone https://github.com/nestor-home/nestor && cd nestor" },
  { id: "qs-2", command: "docker compose run --rm nestor init" },
  { id: "qs-3", command: "$EDITOR data/.env" },
  { id: "qs-4", command: "docker compose up -d" },
] as const;

export const ADMIN_URL = "http://localhost:8080";
