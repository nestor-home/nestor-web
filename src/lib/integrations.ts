/**
 * The services Nestor connects to, grouped by what they bring to a household: one source for the
 * home page and the developers' page. `available` means the framework ships it today (devices
 * through Home Assistant, tools through the service's own MCP server); everything else is `planned`
 * and says so on both pages.
 */
import type { BrandKey } from "@/lib/brands";

export interface Integration {
  brand: BrandKey;
  status: "available" | "planned";
}

export const INTEGRATIONS: { group: string; items: Integration[] }[] = [
  {
    group: "home",
    items: [
      { brand: "home-assistant", status: "available" },
      { brand: "philips-hue", status: "available" },
      { brand: "ikea", status: "available" },
      { brand: "sonos", status: "available" },
      { brand: "tado", status: "available" },
    ],
  },
  {
    group: "messages",
    items: [
      { brand: "telegram", status: "available" },
      { brand: "discord", status: "available" },
      { brand: "slack", status: "available" },
      { brand: "signal", status: "available" },
      { brand: "matrix", status: "available" },
      { brand: "whatsapp", status: "available" },
    ],
  },
  {
    group: "mail",
    items: [
      { brand: "gmail", status: "available" },
      { brand: "google-calendar", status: "available" },
      { brand: "google-drive", status: "available" },
      { brand: "microsoft", status: "available" },
      { brand: "icloud", status: "available" },
      { brand: "nextcloud", status: "available" },
      { brand: "imap", status: "available" },
    ],
  },
  {
    group: "web",
    items: [
      { brand: "brave", status: "available" },
      { brand: "searxng", status: "available" },
      { brand: "tavily", status: "available" },
      { brand: "open-meteo", status: "available" },
      { brand: "openstreetmap", status: "available" },
      { brand: "rss", status: "available" },
    ],
  },
  {
    group: "lists",
    items: [
      { brand: "todoist", status: "available" },
      { brand: "google-keep", status: "planned" },
      { brand: "notion", status: "available" },
      { brand: "spotify", status: "planned" },
    ],
  },
  {
    group: "work",
    items: [
      { brand: "mcp", status: "available" },
      { brand: "github", status: "available" },
      { brand: "linear", status: "available" },
      { brand: "hermes", status: "available" },
      { brand: "codex", status: "available" },
      { brand: "claude-code", status: "available" },
    ],
  },
];
