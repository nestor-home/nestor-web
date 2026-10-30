import type { APIRoute } from "astro";
import { iconSvg } from "@/lib/og";

export const GET: APIRoute = () => new Response(iconSvg(64), { headers: { "Content-Type": "image/svg+xml" } });
