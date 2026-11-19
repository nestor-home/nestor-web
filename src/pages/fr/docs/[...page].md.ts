/** Each page of the docs as Markdown, beside it: /fr/docs/<slug>.md (nested slugs: <group>/<page>.md). */
import { markdownRoutes } from "@/lib/llms";

const routes = markdownRoutes("fr");
export const getStaticPaths = routes.paths;
export const GET = routes.serve;
