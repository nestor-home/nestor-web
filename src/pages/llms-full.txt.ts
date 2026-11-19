import type { APIRoute } from "astro";
import { full, TEXT } from "@/lib/llms";

export const GET: APIRoute = async () => new Response(await full("en"), { headers: TEXT });
