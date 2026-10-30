/**
 * Nestor's stills, published with the site (and copied to the admin): avatars in both themes,
 * the favicon tile, and PNG sizes for places that need bitmaps.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import { PALETTES, renderNestorStill } from "@/character/render";
import { INK, PAPER, pngOf } from "@/lib/og";

const TILE = { ink: PAPER, paper: INK, ember: "#e8835c" };

const FILES: Record<string, () => { body: string | ArrayBuffer; type: string }> = {
  "avatar-light.svg": () => ({ body: renderNestorStill(120, PALETTES.light), type: "image/svg+xml" }),
  "avatar-dark.svg": () => ({ body: renderNestorStill(120, PALETTES.dark), type: "image/svg+xml" }),
  "tile.svg": () => ({ body: renderNestorStill(120, TILE, INK), type: "image/svg+xml" }),
  "avatar-512.png": () => ({ body: pngOf(renderNestorStill(512, PALETTES.light), 512), type: "image/png" }),
  "tile-512.png": () => ({ body: pngOf(renderNestorStill(512, TILE, INK), 512), type: "image/png" }),
  "tile-180.png": () => ({ body: pngOf(renderNestorStill(180, TILE, INK), 180), type: "image/png" }),
  "tile-32.png": () => ({ body: pngOf(renderNestorStill(32, TILE, INK), 32), type: "image/png" }),
  "tile-16.png": () => ({ body: pngOf(renderNestorStill(16, TILE, INK), 16), type: "image/png" }),
};

export const getStaticPaths: GetStaticPaths = () => Object.keys(FILES).map((file) => ({ params: { file } }));

export const GET: APIRoute = ({ params }) => {
  const make = FILES[params.file ?? ""];
  if (!make) return new Response(null, { status: 404 });
  const { body, type } = make();
  return new Response(body, { headers: { "Content-Type": type } });
};
