/**
 * Third-party marks the site shows, in one place (the admin's registry, trimmed). Marks identify an
 * integration (nominative use) and are never Nestor's branding; Simple Icons paths (CC0), in ink.
 */
import {
  siDiscord,
  siGithub,
  siGmail,
  siGooglecalendar,
  siHomeassistant,
  siLinear,
  siModelcontextprotocol,
  siNotion,
  siPython,
  siRaspberrypi,
  siRust,
  siSqlite,
  siTelegram,
  siTypescript,
  siWebrtc,
  siWhatsapp,
} from "simple-icons";

export interface Brand {
  name: string;
  path: string;
}

const mark = (name: string, icon: { path: string }): Brand => ({ name, path: icon.path });

export const BRANDS = {
  gmail: mark("Gmail", siGmail),
  "google-calendar": mark("Google Calendar", siGooglecalendar),
  telegram: mark("Telegram", siTelegram),
  whatsapp: mark("WhatsApp", siWhatsapp),
  discord: mark("Discord", siDiscord),
  "home-assistant": mark("Home Assistant", siHomeassistant),
  mcp: mark("Model Context Protocol", siModelcontextprotocol),
  linear: mark("Linear", siLinear),
  notion: mark("Notion", siNotion),
  github: mark("GitHub", siGithub),
  python: mark("Python", siPython),
  typescript: mark("TypeScript", siTypescript),
  rust: mark("Rust", siRust),
  webrtc: mark("WebRTC", siWebrtc),
  "raspberry-pi": mark("Raspberry Pi", siRaspberrypi),
  sqlite: mark("SQLite", siSqlite),
} as const satisfies Record<string, Brand>;

export type BrandKey = keyof typeof BRANDS;
