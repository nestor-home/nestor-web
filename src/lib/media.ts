/**
 * The admin captures and recordings this build has (see scripts/capture-admin.mjs). Sections
 * render only what exists, so the site builds before the media are produced.
 */
import type { ImageMetadata } from "astro";
import type { Locale } from "@/i18n";

export type Theme = "light" | "dark";
export const THEMES: readonly Theme[] = ["light", "dark"];

const SHOTS = import.meta.glob<{ default: ImageMetadata }>("../assets/captures/*.webp", { eager: true });

export function shot(name: string, theme: Theme, locale: Locale): ImageMetadata | undefined {
  const exact = SHOTS[`../assets/captures/${name}-${theme}-${locale}.webp`];
  const fallback = SHOTS[`../assets/captures/${name}-${theme}-en.webp`];
  return (exact ?? fallback)?.default;
}

interface ClipInfo {
  themes: Theme[];
  locales: Locale[];
  width: number;
  height: number;
  duration?: number;
}

interface MediaIndex {
  shots?: string[];
  clips?: Record<string, ClipInfo>;
  twin?: { width: number; height: number; duration?: number; file?: string };
}

const INDEX = Object.values(import.meta.glob<{ default: MediaIndex }>("../data/media.json", { eager: true }))[0]
  ?.default ?? { clips: {} };

export interface ClipSource {
  theme: Theme;
  base: string;
  width: number;
  height: number;
}

/** The recordings of a clip, one per theme, in the reader's language when it exists. */
export function clip(name: string, locale: Locale): ClipSource[] {
  const info = INDEX.clips?.[name];
  if (!info) return [];
  const lang = info.locales.includes(locale) ? locale : info.locales[0];
  if (!lang) return [];
  const themes = THEMES.map((theme) => (info.themes.includes(theme) ? theme : info.themes[0])) as Theme[];
  return THEMES.map((theme, i) => ({
    theme,
    base: `/media/${name}-${themes[i]}-${lang}`,
    width: info.width,
    height: info.height,
  }));
}
