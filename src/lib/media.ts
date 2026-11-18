/** The admin's screens the site shows: one capture per theme and language (scripts/capture-admin.mjs). */
import type { ImageMetadata } from "astro";
import type { Locale } from "@/i18n";

export type Theme = "light" | "dark";
export const THEMES: readonly Theme[] = ["light", "dark"];

const SHOTS = import.meta.glob<{ default: ImageMetadata }>("../assets/captures/*.webp", { eager: true });

/** A capture in a theme and a language; a missing one fails the build. */
export function shot(name: string, theme: Theme, locale: Locale): ImageMetadata {
  const found = SHOTS[`../assets/captures/${name}-${theme}-${locale}.webp`];
  if (!found) throw new Error(`[media] no capture "${name}" in ${theme}, ${locale}`);
  return found.default;
}
