import type { APIRoute } from "astro";
import { index, TEXT } from "@/lib/llms";

export const GET: APIRoute = async () => new Response(await index("fr"), { headers: TEXT });
