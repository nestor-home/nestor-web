/**
 * The services Nestor connects to, grouped by what they bring to a household: one source for the
 * home page and the developers' page. `available` means the framework ships it today (devices
 * through Home Assistant, tools through a generic MCP server); everything else is `planned` and
 * says so on both pages.
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
      { brand: "whatsapp", status: "planned" },
      { brand: "signal", status: "planned" },
      { brand: "discord", status: "planned" },
      { brand: "matrix", status: "planned" },
    ],
  },
  {
    group: "mail",
    items: [
      { brand: "gmail", status: "available" },
      { brand: "imap", status: "available" },
      { brand: "google-calendar", status: "planned" },
      { brand: "icloud", status: "planned" },
      { brand: "nextcloud", status: "planned" },
    ],
  },
  {
    group: "lists",
    items: [
      { brand: "todoist", status: "planned" },
      { brand: "google-keep", status: "planned" },
      { brand: "notion", status: "planned" },
      { brand: "spotify", status: "planned" },
    ],
  },
  {
    group: "work",
    items: [
      { brand: "mcp", status: "available" },
      { brand: "github", status: "planned" },
      { brand: "linear", status: "planned" },
      { brand: "hermes", status: "available" },
      { brand: "codex", status: "planned" },
    ],
  },
];
