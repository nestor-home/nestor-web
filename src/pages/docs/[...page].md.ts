import type { APIRoute, GetStaticPaths } from "astro";
import { MARKDOWN, pageDocument, pages } from "@/lib/llms";

/** Each page of the docs as Markdown, beside it: /docs/<slug>.md (nested slugs: <group>/<page>.md). */
export const getStaticPaths: GetStaticPaths = async () =>
  (await pages("en"))
    .flatMap((g) => g.pages)
    .map((page) => ({ params: { page: page.slug || "index" }, props: { page } }));

export const GET: APIRoute = ({ props }) =>
  new Response(pageDocument("en", props.page as Parameters<typeof pageDocument>[1]), { headers: MARKDOWN });
