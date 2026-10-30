/**
 * Pictures drawn at build time with Satori (layout and text as SVG paths) and resvg (PNG): the
 * Open Graph cards and the icons. Static fonts, because Satori reads WOFF, not variable WOFF2.
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { PALETTES, renderNestorStill } from "@/character/render";
import { ditherSvg } from "./dither";

const require = createRequire(import.meta.url);
const font = (path: string) => readFile(require.resolve(path));

export const PAPER = "#f5f0e6";
export const INK = "#1d1913";
export const INK_MUTED = "#62584c";
export const EMBER = "#ad401d";
export const RULE = "#ddd4c4";

type Child = Node | string | null | undefined | false;
export interface Node {
  type: string;
  props: Record<string, unknown> & { children?: Child | Child[] };
}

/** A tiny element factory, so the pictures read like markup without JSX. */
export function h(type: string, style: Record<string, unknown>, ...children: Child[]): Node {
  return { type, props: { style: { display: "flex", ...style }, children } };
}

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 500; style: "normal" }[]> | undefined;
function loadFonts() {
  fonts ??= Promise.all([
    font("@fontsource/fraunces/files/fraunces-latin-400-normal.woff").then((data) => ({
      name: "Fraunces",
      data,
      weight: 400 as const,
      style: "normal" as const,
    })),
    font("@fontsource/fraunces/files/fraunces-latin-500-normal.woff").then((data) => ({
      name: "Fraunces",
      data,
      weight: 500 as const,
      style: "normal" as const,
    })),
    font("@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff").then((data) => ({
      name: "Instrument Sans",
      data,
      weight: 400 as const,
      style: "normal" as const,
    })),
    font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff").then((data) => ({
      name: "IBM Plex Mono",
      data,
      weight: 400 as const,
      style: "normal" as const,
    })),
  ]);
  return fonts;
}

export async function svgOf(node: Node, width: number, height: number): Promise<string> {
  // biome-ignore lint/suspicious/noExplicitAny: Satori takes React elements; our nodes have their shape
  return satori(node as any, { width, height, fonts: await loadFonts() });
}

export function pngOf(svg: string, width: number): ArrayBuffer {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
}

export function ditherImage(width: number, height: number, from: number, to: number, colour: string): string {
  const svg = ditherSvg("horizon", width, height, 4, colour, from, to);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** The wordmark: "nestor" in the display serif, then the ember block cursor. */
export function wordmark(size: number): Node {
  return h(
    "div",
    { alignItems: "flex-end", gap: size * 0.1 },
    h(
      "div",
      {
        fontFamily: "Fraunces",
        fontWeight: 500,
        fontSize: size,
        color: INK,
        letterSpacing: -size * 0.02,
        lineHeight: 1,
      },
      "nestor",
    ),
    h("div", { width: size * 0.36, height: size * 0.62, background: EMBER, marginBottom: size * 0.12 }),
  );
}

/** The icon: Nestor in paper on an ink tile (it reads on light and dark tabs alike). */
export function iconSvg(size: number): string {
  return renderNestorStill(size, { ink: PAPER, paper: INK, ember: "#e8835c" }, INK);
}

/** Nestor as a picture, for the sharing cards. */
export function characterImage(size: number): string {
  return `data:image/svg+xml;base64,${Buffer.from(renderNestorStill(size, PALETTES.light)).toString("base64")}`;
}
