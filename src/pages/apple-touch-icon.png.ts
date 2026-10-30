import type { APIRoute } from "astro";
import { icon, pngOf, svgOf } from "@/lib/og";

export const GET: APIRoute = async () =>
  new Response(pngOf(await svgOf(icon(180), 180, 180), 180), { headers: { "Content-Type": "image/png" } });
