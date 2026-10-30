import type { APIRoute } from "astro";
import { iconSvg, pngOf } from "@/lib/og";

export const GET: APIRoute = () => new Response(pngOf(iconSvg(180), 180), { headers: { "Content-Type": "image/png" } });
