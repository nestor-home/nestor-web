/**
 * Third-party marks the site shows, in one place (the admin's registry, trimmed). Marks identify an
 * integration (nominative use) and are never Nestor's branding: Simple Icons paths (CC0) where the
 * brand is there, the admin's neutral lucide glyph otherwise (Hermes, Codex, any mailbox). They are
 * drawn in ink; `hex` is the brand's own colour, shown on hover where it reads on both themes.
 */
import type { LucideIcon } from "lucide-react";
import { Cpu, Feather, Mail } from "lucide-react";
import {
  type SimpleIcon,
  siDiscord,
  siGithub,
  siGmail,
  siGooglecalendar,
  siGooglekeep,
  siHomeassistant,
  siIcloud,
  siIkea,
  siLinear,
  siModelcontextprotocol,
  siNextcloud,
  siNotion,
  siPhilipshue,
  siPython,
  siRaspberrypi,
  siRust,
  siSignal,
  siSonos,
  siSpotify,
  siSqlite,
  siTado,
  siTelegram,
  siTodoist,
  siTypescript,
  siWebrtc,
  siWhatsapp,
} from "simple-icons";

export interface Brand {
  name: string;
  /** a Simple Icons path in a 24×24 box, or a lucide glyph */
  path?: string;
  glyph?: LucideIcon;
  /** the brand's colour, only when it stays legible on paper and on ink */
  hex?: string;
}

/** Relative luminance of a `RRGGBB` colour (WCAG). */
function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const mark = (name: string, icon: SimpleIcon): Brand => {
  const l = luminance(icon.hex);
  // black or white marks (GitHub, Notion, Sonos…) stay in ink: their colour would vanish on a theme
  return l > 0.04 && l < 0.7 ? { name, path: icon.path, hex: `#${icon.hex}` } : { name, path: icon.path };
};
const glyph = (name: string, icon: LucideIcon): Brand => ({ name, glyph: icon });

export const BRANDS = {
  gmail: mark("Gmail", siGmail),
  "google-calendar": mark("Google Calendar", siGooglecalendar),
  "google-keep": mark("Google Keep", siGooglekeep),
  icloud: mark("iCloud", siIcloud),
  nextcloud: mark("Nextcloud", siNextcloud),
  imap: glyph("IMAP", Mail),
  telegram: mark("Telegram", siTelegram),
  whatsapp: mark("WhatsApp", siWhatsapp),
  signal: mark("Signal", siSignal),
  discord: mark("Discord", siDiscord),
  "home-assistant": mark("Home Assistant", siHomeassistant),
  "philips-hue": mark("Philips Hue", siPhilipshue),
  ikea: mark("IKEA", siIkea),
  sonos: mark("Sonos", siSonos),
  tado: mark("tado°", siTado),
  spotify: mark("Spotify", siSpotify),
  todoist: mark("Todoist", siTodoist),
  notion: mark("Notion", siNotion),
  mcp: mark("MCP", siModelcontextprotocol),
  linear: mark("Linear", siLinear),
  github: mark("GitHub", siGithub),
  hermes: glyph("Hermes", Feather),
  codex: glyph("Codex", Cpu),
  python: mark("Python", siPython),
  typescript: mark("TypeScript", siTypescript),
  rust: mark("Rust", siRust),
  webrtc: mark("WebRTC", siWebrtc),
  "raspberry-pi": mark("Raspberry Pi", siRaspberrypi),
  sqlite: mark("SQLite", siSqlite),
} as const satisfies Record<string, Brand>;

export type BrandKey = keyof typeof BRANDS;
