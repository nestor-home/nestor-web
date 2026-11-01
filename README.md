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

## Production

`https://nestor.mathislambert.fr` serves the image `ghcr.io/nestor-home/nestor-web`: the static
build behind an unprivileged, read-only Nginx, joined to the server's Traefik network `proxy`.

Pull requests are squash-merged with a Conventional Commit title. release-please then keeps a
release pull request open; merging it builds the site, publishes the image (amd64, arm64) and
deploys it once the `production` environment is approved (`.github/workflows/release.yml`).
To deploy an earlier version again: Actions → Deploy → Run workflow.

The server only holds `deploy/compose.prod.yaml` and the shared `deploy.sh`
([nestor-home/.github](https://github.com/nestor-home/.github)); it never builds anything.

## License

MIT
