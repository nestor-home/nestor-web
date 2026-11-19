/** A docs page read by a language model holds what the page shows, as Markdown: no import, no component tag. */
import { describe, expect, it } from "vitest";
import { markdownHref, toMarkdown } from "@/lib/markdown";

const page = `import Cards from "@/components/docs/Cards.astro";
import Card from "@/components/docs/Card.astro";

Read [the quickstart](/docs/quickstart/) first.

<Cards cols={2}>
<Card title="Models" href="/docs/models/" icon="sparkles">Pick the model it thinks with.</Card>
<Card title="Home" icon="home">Plain card.</Card>
</Cards>

<Callout kind="warning">
Keep the key secret.
</Callout>

<Providers kind="speech" locale="en">
<ProviderSetup kind="speech" brand="elevenlabs">

Set \`ELEVENLABS_API_KEY\`.

</ProviderSetup>
</Providers>

<SystemMap locale="en" n={1} />`;

describe("a docs page as Markdown", () => {
  const md = toMarkdown(page);

  it("keeps the words and turns cards, callouts and setups into Markdown", () => {
    expect(md).toContain("- [Models](https://nestorhome.dev/docs/models/): Pick the model it thinks with.");
    expect(md).toContain("- **Home**: Plain card.");
    expect(md).toContain("> Keep the key secret.");
    expect(md).toContain("### ElevenLabs");
    expect(md).toContain("Set `ELEVENLABS_API_KEY`.");
    expect(md).toContain("[the quickstart](https://nestorhome.dev/docs/quickstart/)");
  });

  it("leaves no import and no component tag", () => {
    expect(md).not.toMatch(/^import /m);
    expect(md).not.toMatch(/<\/?[A-Z]/);
  });

  it("is served beside the page, the first one as index", () => {
    expect(markdownHref("en", "")).toBe("/docs/index.md");
    expect(markdownHref("fr", "agent/memory")).toBe("/fr/docs/agent/memory.md");
  });
});

describe("a component the conversion does not know", () => {
  it("is refused, never dropped", () => {
    expect(() => toMarkdown("<Mystery>text</Mystery>")).toThrow(/Mystery/);
  });
});

describe("a code example", () => {
  it("is kept exactly as written, imports, generics and links included", () => {
    const code = "```python\nimport asyncio\nlinks: list[str] = []  # see [docs](/docs/)\n```";
    const ts = "   ```ts\nconst all: Array<Satellite> = [];\n   ```";
    const md = toMarkdown(
      `import Steps from "x";\n\nBefore.\n\n${code}\n\n<Steps>\n\n1. **Run.**\n\n${ts}\n\n</Steps>`,
    );
    expect(md).toContain(code);
    expect(md).toContain(ts);
    expect(md).not.toMatch(/^import Steps/m);
  });
});
