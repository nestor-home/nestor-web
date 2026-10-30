/**
 * Code highlighted at build time with Shiki, in the identity's colours: a theme whose colours are
 * placeholders, swapped for the tokens' CSS variables, so the same HTML reads in both themes.
 */
import { createHighlighter, type ThemeRegistrationRaw } from "shiki";

const SLOTS = {
  "#000001": "var(--ink)",
  "#000002": "var(--ink-muted)",
  "#000003": "var(--ember)",
  "#000004": "var(--sage)",
  "#000005": "var(--kind-watch)",
  "#000006": "var(--kind-task)",
  "#000007": "var(--ink-muted)",
} as const;

const theme: ThemeRegistrationRaw = {
  name: "nestor",
  type: "light",
  settings: [
    { settings: { foreground: "#000001", background: "#ffffff" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#000002" } },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.operator.new", "variable.language"],
      settings: { foreground: "#000003" },
    },
    { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: "#000004" } },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call",
        "entity.name.type",
        "entity.name.class",
      ],
      settings: { foreground: "#000005" },
    },
    {
      scope: [
        "constant",
        "support.constant",
        "variable.other.constant",
        "constant.numeric",
        "support.type",
        "entity.name.namespace",
      ],
      settings: { foreground: "#000006" },
    },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#000007" } },
  ],
};

export type Lang = "python" | "typescript" | "rust" | "bash" | "json";

let highlighter: ReturnType<typeof createHighlighter> | undefined;

export async function highlight(code: string, lang: Lang): Promise<string> {
  highlighter ??= createHighlighter({ themes: [theme], langs: ["python", "typescript", "rust", "bash", "json"] });
  const html = (await highlighter).codeToHtml(code.trim(), { lang, theme: "nestor" });
  return html
    .replace(/#00000([1-7])/gi, (hex) => SLOTS[hex.toLowerCase() as keyof typeof SLOTS])
    .replace(/background-color:#ffffff;?/i, "");
}
