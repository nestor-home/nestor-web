/**
 * Third-party marks the site shows, in one place (the admin's registry, trimmed). Marks identify an
 * integration (nominative use) and are never Nestor's branding. Sources: Simple Icons (CC0) for
 * services, Lobe Icons (`@lobehub/icons-static-svg`, MIT, by LobeHub) for AI providers, which Simple
 * Icons partly dropped at the brands' request, and for a brand in neither set its official mark,
 * kept in src/assets/brands/ with its source and drawn in one colour. The admin's neutral lucide
 * glyph stands for what is not a brand (any mailbox); a brand without any published
 * mark gets a text monogram, never a drawn imitation. They are drawn in ink; `hex` is the brand's
 * own colour, shown on hover where it reads on both themes.
 */
import anthropicSvg from "@lobehub/icons-static-svg/icons/anthropic.svg?raw";
import codexSvg from "@lobehub/icons-static-svg/icons/codex.svg?raw";
import elevenlabsSvg from "@lobehub/icons-static-svg/icons/elevenlabs.svg?raw";
import geminiSvg from "@lobehub/icons-static-svg/icons/gemini.svg?raw";
import groqSvg from "@lobehub/icons-static-svg/icons/groq.svg?raw";
import hermesagentSvg from "@lobehub/icons-static-svg/icons/hermesagent.svg?raw";
import lmstudioSvg from "@lobehub/icons-static-svg/icons/lmstudio.svg?raw";
import mistralSvg from "@lobehub/icons-static-svg/icons/mistral.svg?raw";
import ollamaSvg from "@lobehub/icons-static-svg/icons/ollama.svg?raw";
import openaiSvg from "@lobehub/icons-static-svg/icons/openai.svg?raw";
import openrouterSvg from "@lobehub/icons-static-svg/icons/openrouter.svg?raw";
import vllmSvg from "@lobehub/icons-static-svg/icons/vllm.svg?raw";
import type { LucideIcon } from "lucide-react";
import { Mail, RadioTower } from "lucide-react";
import {
  type SimpleIcon,
  siAnthropic,
  siDeepgram,
  siDiscord,
  siDocker,
  siGithub,
  siGmail,
  siGooglecalendar,
  siGooglegemini,
  siGooglekeep,
  siHomeassistant,
  siIcloud,
  siIkea,
  siLinear,
  siLmstudio,
  siMatrix,
  siMistralai,
  siModelcontextprotocol,
  siNextcloud,
  siNotion,
  siOpenrouter,
  siPhilipshue,
  siPypi,
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
  siUv,
  siVllm,
  siWhatsapp,
} from "simple-icons";
import cartesiaSvg from "@/assets/brands/cartesia.svg?raw";
import gradiumSvg from "@/assets/brands/gradium.svg?raw";
import llamaCppSvg from "@/assets/brands/llama-cpp.svg?raw";
import piperSvg from "@/assets/brands/piper.svg?raw";

export interface Brand {
  name: string;
  /** paths in a 24×24 box (Simple Icons, Lobe Icons), a lucide glyph, or a text monogram */
  paths?: readonly string[];
  glyph?: LucideIcon;
  monogram?: string;
  /** an official mark in its own box: its viewBox and its shapes, filled with the current colour */
  official?: { viewBox: string; shapes: string };
  /** paths drawn with the even-odd rule (Lobe Icons) */
  evenodd?: boolean;
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
  return l > 0.04 && l < 0.7 ? { name, paths: [icon.path], hex: `#${icon.hex}` } : { name, paths: [icon.path] };
};
const glyph = (name: string, icon: LucideIcon): Brand => ({ name, glyph: icon });
/** A Lobe Icons mark (monochrome, 24×24): its paths, and the brand's colour from Simple Icons when it has one. */
const lobe = (name: string, svg: string, colour?: SimpleIcon): Brand => {
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1] ?? "");
  if (paths.length === 0) throw new Error(`[brands] no path in the ${name} mark`);
  const hex = colour ? mark(name, colour).hex : undefined;
  return hex ? { name, paths, evenodd: true, hex } : { name, paths, evenodd: true };
};
const monogram = (name: string, letters: string): Brand => ({ name, monogram: letters });
/** An official mark from src/assets/brands/: its viewBox and the shapes inside its root. */
const official = (name: string, svg: string): Brand => {
  const viewBox = svg.match(/<svg[^>]*\sviewBox="([^"]+)"/)?.[1];
  const shapes = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
  if (!viewBox || !shapes) throw new Error(`[brands] the ${name} mark has no viewBox or shapes`);
  return { name, official: { viewBox, shapes } };
};

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
  matrix: mark("Matrix", siMatrix),
  satellites: glyph("Satellites", RadioTower), // the satellites channel, not a brand: its name on a page comes from Fluent
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
  hermes: lobe("Hermes", hermesagentSvg),
  codex: lobe("Codex", codexSvg),
  python: mark("Python", siPython),
  typescript: mark("TypeScript", siTypescript),
  rust: mark("Rust", siRust),
  "raspberry-pi": mark("Raspberry Pi", siRaspberrypi),
  sqlite: mark("SQLite", siSqlite),
  // the ways to install the server (the documentation's installation page)
  uv: mark("uv", siUv),
  pip: mark("pip", siPypi),
  docker: mark("Docker", siDocker),
  // model and speech providers (the documentation's models and channels pages)
  openrouter: lobe("OpenRouter", openrouterSvg, siOpenrouter),
  openai: lobe("OpenAI", openaiSvg),
  mistral: lobe("Mistral", mistralSvg, siMistralai),
  groq: lobe("Groq", groqSvg),
  gemini: lobe("Gemini", geminiSvg, siGooglegemini),
  anthropic: lobe("Anthropic", anthropicSvg, siAnthropic),
  ollama: lobe("Ollama", ollamaSvg),
  "lm-studio": lobe("LM Studio", lmstudioSvg, siLmstudio),
  vllm: lobe("vLLM", vllmSvg, siVllm),
  "llama-cpp": official("llama.cpp", llamaCppSvg),
  elevenlabs: lobe("ElevenLabs", elevenlabsSvg),
  gradium: official("Gradium", gradiumSvg),
  deepgram: mark("Deepgram", siDeepgram),
  cartesia: official("Cartesia", cartesiaSvg),
  whisper: lobe("Whisper", openaiSvg), // OpenAI's model: its maker's mark
  kokoro: monogram("Kokoro", "K"),
  piper: official("Piper", piperSvg),
} as const satisfies Record<string, Brand>;

export type BrandKey = keyof typeof BRANDS;
