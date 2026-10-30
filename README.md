# nestor-web

The website of [Nestor](https://github.com/nestor-home/nestor), the open-source runtime for
persistent personal agents at home — in English at `/` and in French at `/fr/`.
It will live at nestor.mathislambert.fr.

Astro (static output), one React island, Tailwind v4 on the admin's design tokens, Project Fluent
for the words, Shiki for the code, real captures of the admin for the pictures.

```bash
pnpm install
pnpm dev                       # http://localhost:4321
pnpm build && pnpm preview     # the static site in dist/
pnpm lint && pnpm typecheck && pnpm test
pnpm build && pnpm e2e         # Playwright on the built site: 3 widths, 2 themes, 2 languages
```

Node 22.23.4 or later (`.nvmrc`), pnpm 12. See [AGENTS.md](AGENTS.md) for the conventions and
how to refresh the captures, the recordings and the code examples.

## License

MIT
