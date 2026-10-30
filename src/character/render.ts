/**
 * Nestor as SVG markup, framework-agnostic: a string any page can inline (Astro, React, plain
 * HTML). Its colours come only from CSS variables (`--ink`, `--paper`, `--ember`, with fallbacks),
 * so light and dark follow the page; `nestor.css` animates the states.
 */
import {
  BODY,
  BOW,
  brow,
  EYE,
  EYES,
  happyEye,
  KNOT,
  MOUTH,
  RIM,
  SIZE,
  SOUND,
  SPINNER,
  shutEye,
  THOUGHTS,
  TUFT,
  VIEWBOX,
} from "./geometry";

export const STATES = [
  "idle",
  "listening",
  "thinking",
  "speaking",
  "laughing",
  "sleeping",
  "working",
  "concerned",
] as const;
export type NestorState = (typeof STATES)[number];

export interface RenderOptions {
  state?: NestorState;
  /** pixels (or any CSS length); at 24 px and below the drawing drops its small details */
  size?: number | string;
  /** an accessible name; without one the drawing is decorative (aria-hidden) */
  label?: string;
  className?: string;
  id?: string;
  /** a soft ground shadow under it */
  ground?: boolean;
  /** extra attributes for the root element (data-*, style…), escaped */
  attributes?: Record<string, string>;
}

const escapeAttr = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

let serial = 0;

export function renderNestor({
  state = "idle",
  size = SIZE,
  label,
  className = "",
  id,
  ground = false,
  attributes = {},
}: RenderOptions = {}): string {
  const tiny = typeof size === "number" && size <= 24;
  const uid = `nestor-${(serial++).toString(36)}`;
  const dimension = typeof size === "number" ? `${size}` : escapeAttr(size);
  const extra = Object.entries(attributes)
    .filter(([name]) => /^[a-z][a-z0-9-]*$/.test(name))
    .map(([name, value]) => ` ${name}="${escapeAttr(value)}"`)
    .join("");
  const a11y = label ? `role="img" aria-label="${escapeAttr(label)}"` : `aria-hidden="true"`;
  const eyes = EYES.map(
    (e, i) =>
      `<g class="nestor-eye nestor-eye-${i === 0 ? "l" : "r"}">` +
      `<ellipse class="nestor-iris" cx="${e.cx}" cy="${e.cy}" rx="${EYE.rx}" ry="${EYE.ry}"/>` +
      `<rect class="nestor-lid" x="${e.cx - EYE.rx - 1}" y="${e.cy - EYE.ry - 1}" width="${EYE.rx * 2 + 2}" height="${EYE.ry * 2 + 2}"/>` +
      `</g>`,
  ).join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" width="${dimension}" height="${dimension}"`,
    ` class="nestor${tiny ? " nestor--tiny" : ""}${className ? ` ${escapeAttr(className)}` : ""}"`,
    ` data-state="${state}"${id ? ` id="${escapeAttr(id)}"` : ""}${extra} ${a11y}>`,
    ground
      ? `<defs><pattern id="${uid}-g" width="3" height="3" patternUnits="userSpaceOnUse"><rect class="nestor-ground-dot" width="1.2" height="1.2"/></pattern></defs>` +
        `<ellipse class="nestor-ground" cx="60" cy="112" rx="30" ry="4" fill="url(#${uid}-g)"/>`
      : "",
    `<g class="nestor-figure"><g class="nestor-breath">`,
    `<path class="nestor-tuft" d="${TUFT}"/>`,
    `<path class="nestor-skin" d="${BODY}"/>`,
    tiny ? "" : `<path class="nestor-rim" d="${RIM}"/>`,
    tiny ? "" : `<g class="nestor-bow"><path d="${BOW}"/><circle cx="${KNOT.cx}" cy="${KNOT.cy}" r="${KNOT.r}"/></g>`,
    `<g class="nestor-face">`,
    `<g class="nestor-brows"><path class="nestor-brow nestor-brow-l" d="${brow(EYES[0].cx, EYES[0].cy)}"/>`,
    `<path class="nestor-brow nestor-brow-r" d="${brow(EYES[1].cx, EYES[1].cy)}"/></g>`,
    `<g class="nestor-eyes">${eyes}`,
    `<g class="nestor-happy">${EYES.map((e) => `<path d="${happyEye(e.cx, e.cy)}"/>`).join("")}</g>`,
    `<g class="nestor-shut">${EYES.map((e) => `<path d="${shutEye(e.cx, e.cy)}"/>`).join("")}</g>`,
    `</g>`,
    `<rect class="nestor-mouth" x="${MOUTH.x}" y="${MOUTH.y}" width="${MOUTH.width}" height="${MOUTH.height}"/>`,
    `</g></g></g>`,
    tiny
      ? ""
      : `<g class="nestor-signs">` +
        `<g class="nestor-thoughts">${THOUGHTS.map((d) => `<rect x="${d.x}" y="${d.y}" width="${d.size}" height="${d.size}"/>`).join("")}</g>` +
        `<path class="nestor-spinner" d="${SPINNER}"/>` +
        `<g class="nestor-sound">${SOUND.map((d) => `<path d="${d}"/>`).join("")}</g>` +
        `</g>`,
    `</svg>`,
  ].join("");
}

export interface Palette {
  ink: string;
  paper: string;
  ember: string;
}

export const PALETTES = {
  light: { ink: "#1d1913", paper: "#f5f0e6", ember: "#ad401d" },
  dark: { ink: "#eee7da", paper: "#16130f", ember: "#e8835c" },
} as const satisfies Record<string, Palette>;

/**
 * A still picture with its colours written in, for places without CSS: favicons, avatars,
 * sharing images. `background` draws a rounded tile behind it (an app-icon look).
 */
export function renderNestorStill(size: number, palette: Palette = PALETTES.light, background?: string): string {
  const tiny = size <= 24;
  const tile = background ? `<rect width="120" height="120" rx="26" fill="${background}"/>` : "";
  const scale = background ? `transform="translate(12 10) scale(0.8)"` : "";
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${VIEWBOX}">`,
    `<title>Nestor</title>`,
    tile,
    `<g ${scale}>`,
    `<path d="${TUFT}" fill="${palette.ink}"/>`,
    `<path d="${BODY}" fill="${palette.ink}"/>`,
    tiny
      ? ""
      : `<path d="${RIM}" fill="none" stroke="${palette.paper}" stroke-opacity="0.3" stroke-width="2.6" stroke-linecap="round"/>`,
    tiny
      ? ""
      : `<path d="${BOW}" fill="${palette.paper}"/><circle cx="${KNOT.cx}" cy="${KNOT.cy}" r="${KNOT.r}" fill="${palette.paper}"/>`,
    EYES.map((e) => `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${EYE.rx}" ry="${EYE.ry}" fill="${palette.paper}"/>`).join(
      "",
    ),
    `<rect x="${MOUTH.x}" y="${MOUTH.y}" width="${MOUTH.width}" height="${MOUTH.height}" fill="${palette.ember}"/>`,
    `</g></svg>`,
  ].join("");
}
