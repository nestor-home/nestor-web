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

/** The quickstart with Docker, as the documentation's first page gives it (src/content/docs/<locale>/index.md). */
export const QUICKSTART = [
  {
    id: "qs-1",
    command:
      "curl -fsSLO https://raw.githubusercontent.com/nestor-home/nestor/main/compose.yaml && docker compose pull",
  },
  { id: "qs-2", command: "docker compose run --rm nestor init" },
  { id: "qs-3", command: "$EDITOR data/.env" },
  { id: "qs-4", command: "docker compose up -d" },
] as const;

/** The shortest install, with pip (the documentation's first page). */
export const INSTALL = ["pip install 'nestor-home[voice]'", "nestor init", "nestor run"] as const;

export const ADMIN_URL = "http://localhost:8080";
