import type { APIRoute } from "astro";
import { icon, svgOf } from "@/lib/og";

export const GET: APIRoute = async () =>
  new Response(await svgOf(icon(64), 64, 64), { headers: { "Content-Type": "image/svg+xml" } });
