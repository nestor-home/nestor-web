import type { APIRoute } from "astro";
import { icon, pngOf, svgOf } from "@/lib/og";

export const GET: APIRoute = async () =>
  new Response(pngOf(await svgOf(icon(64), 64, 64), 32), { headers: { "Content-Type": "image/png" } });
