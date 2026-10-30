import type { APIRoute } from "astro";
import { iconSvg, pngOf } from "@/lib/og";

export const GET: APIRoute = () => new Response(pngOf(iconSvg(32), 32), { headers: { "Content-Type": "image/png" } });
