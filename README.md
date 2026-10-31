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

## Production on the home server

The production checkout is `/opt/mathislambert.fr/applications/nestor-web`.
Traefik serves `https://nestor.mathislambert.fr` with a Let's Encrypt certificate
and an HTTP-to-HTTPS redirect. The static Nginx container joins the existing
external Docker network `proxy`; it publishes no host port and needs no secrets.
This deployment is independent of the optional, manually triggered GitHub Pages workflow.

```bash
git pull --ff-only
NESTOR_WEB_IMAGE=<tested-image-already-pulled-or-loaded> bash scripts/deploy.sh
docker compose -f compose.prod.yaml ps
```

GitHub Actions runs lint, types, unit tests, the static build and Chromium browser
tests. Build the Docker image on a separate development machine or CI, then pull
or load that tested image on the Pi. The deployment script requires a prebuilt
image and switches containers with `--no-build`; it never runs Node or a browser.
The selected image is recorded in an ignored `.env`. The repository's Dockerfile
build/test targets are for CI or a separate development machine, not this server.
Automated image publication is not configured yet; changing the existing workflow
requires a GitHub credential with the `workflow` scope, absent from this session.
The runtime is a read-only, unprivileged static server with no published host port.

## License

MIT
