# AGENTS.md

The website of Nestor. Read this before changing anything; the product's own rules are in the
`nestor` repository (`AGENTS.md`, `CADRAGE.md`, `ROADMAP.md`).

## Commands

```bash
pnpm lint && pnpm typecheck && pnpm test   # Biome, astro check, Vitest
pnpm build && pnpm e2e                     # Playwright on the built site (starts a preview on 4380)
E2E_BASE=http://localhost:4321 pnpm e2e    # against a server already running
docker build -t nestor-web . && docker run --rm -p 8080:8080 nestor-web   # the site's Nginx, then:
E2E_NGINX=1 E2E_BASE=http://localhost:8080 pnpm e2e e2e/nginx.spec.ts
```

`pnpm dev` and `pnpm build` need [uv](https://docs.astral.sh/uv/): they take the protocol's JSON
Schemas and the OAuth relay from the server package first (see "What the build takes from the
server package"). All of them must pass; CI runs them on every
push and pull request. Releases and deployment:
see README.md, Production.

## Layout

```text
src/
├── pages/            home (/ and /fr/), developers (/developers/, /fr/developpeurs/),
│                     docs (/docs/…, /fr/docs/…), 404, og/[page]-[locale].png, favicon*, robots.txt
├── content/docs/     the developer documentation: one Markdown file per page and locale
├── components/
│   ├── Home.astro        the home page: hero, the story (ask once → it watches → it finds you →
│   │                     you see why), same agent in any body, everyday requests and
│   │                     integrations, trust and the journal, install
│   ├── Developers.astro  the developers' page: runtime principles, architecture, the journal's
│   │                     events, extension points, satellites and SDKs, connectors, Home
│   │                     Assistant, security, self-hosting, i18n
│   ├── Nestor.astro      the character (one drawing, six states, a gaze)
│   ├── Device.astro      its bodies: speaker, robot, tablet, laptop, phone, browser tab
│   ├── sections/         one file per section
│   └── *.astro           shared pieces: Shot, Clip, Dither, Brand, Integrations, CopyCommand…
├── islands/          React, only where interaction needs state (the architecture explorer)
├── layouts/          Base (head, header, footer) and Docs (sidebar, text, sections, prev/next)
├── scripts/site.ts   the one global script: reveals, the character's sequences, story stepper
│                     and its presence switch, pairing, tabs (replaying a panel's character), copy,
│                     theme (docs.ts: code copy buttons)
├── locales/<lang>/   the words, in Fluent (.ftl), one file per section
├── i18n/             the Fluent loader (`translator(locale)`)
├── lib/              data and logic: links, brands, dither, Shiki, media index, OG pictures
├── styles/           tokens.css (a verbatim copy of the admin's) and global.css
├── assets/captures/  admin screenshots (WebP sources; Astro derives AVIF/WebP sizes)
└── data/             media.json (what was captured)
public/media/         admin recordings (mp4 + webm + poster)
public/schemas/       the satellite protocol's JSON Schemas, generated at build (not committed)
public/redirect/      the OAuth relay page, copied from the server package at build (not committed)
```

## Two audiences, three places

The home page is about **use**: the promise and the final experience of Nestor, including what is
planned, told through moments almost every household lives (no niche scenarios, no invented brands,
shops, prices or dates). One story shows the core loop; no contract names, no benchmarks, no
internal status, no vendor comparisons; honesty lives in one place (the "early project" line near
Install). Everything technical (architecture, events, protocol, SDK code, self-hosting) goes to the
developers' page, where what is not shipped yet carries a discreet "planned" marker. Keep it that
way when adding content.

How to do things (install, pair, write a satellite, the protocol itself) belongs to the
**documentation** (`/docs/`, `/fr/docs/`): the developers' page shows and links, the docs explain.
It is the single source: the protocol specification lives there (the `nestor` repository only links
to it), and SDK READMEs stay short and link to their page.

## The documentation

- One Markdown file per page and locale in `src/content/docs/<locale>/` (`index.md` for the first
  page; `.mdx` only where a page holds a component, as the providers' picker in `providers.mdx`:
  its tiles come from `lib/providers.ts`, each available provider's setup is a `<ProviderSetup>` in
  the page, and `tests/docs.test.ts` checks both languages give one to each); the reading order and the sidebar's groups are `DOC_GROUPS` in `src/lib/docs.ts`. A page
  needs a `title` and a `description`; `tests/docs.test.ts` fails on a page missing in a locale, a
  file outside the reading order, a link to the other language's docs, or an em-dash.
- Prose lives in the content files, written for each language (French typography as in the
  catalogues); the layout's words (sidebar groups, "On this page"…) are Fluent messages in
  `docs.ftl`.
- Code blocks are highlighted at build (Shiki's `css-variables` theme, coloured by `.doc-prose` in
  `global.css`) and get a copy button. Commands in the docs are run before they are written.
- The developers' page shows each SDK's minimal driver: the **first** code block of that SDK's page
  in its language (`python`, `ts`, `rust`). Change the example there.
- `e2e/docs.spec.ts` walks every page in both languages, follows every internal link and anchor, and
  checks overflow, code, copy and accessibility.

## The character

Nestor's one digital identity — on the website, in the admin, in icons — is the
[`@nestor-home/character`](https://github.com/nestor-home/nestor-character) package: its shapes
(`geometry`), a framework-agnostic SVG renderer, the states in CSS
(`@nestor-home/character/nestor.css`), a small controller (`NestorController`: `state`, `lookAt`,
`say`, `blink`, `gesture`, paused off screen and when the tab is hidden, static under reduced
motion), the logo and the dither. Change the character there, release it, then raise the version
here.

The design: an ink pebble leaning slightly right, a quiff swept to the right, paper eyes, the
wordmark's ember cursor as its mouth, and the logo's bow tie (paper wings, ember knot). Flat colours
only: no highlight, no blush, no texture on its skin; the dither belongs to its surroundings (a
soft disc behind it, a ground, a sky), lightly. One cue per state at most.

The logo is "nestor" in Fraunces followed by the ember bow tie (`renderLogo()`, variant `bow`, the
approved one); `cursor` is the original wordmark. The monogram (`renderMarkStill()`, the bow tie on
an ink tile) is the favicon and app icon. The bow tie is a motif used sparingly: list markers
(`Tie.astro`), one pause on the home page (`TieRule.astro`). The copy uses no em-dashes (a test
checks the catalogues). Eight states
mirror the product's: `idle`, `listening`, `thinking`, `speaking`, `laughing`, `sleeping`,
`working`, `concerned`. On the site, `Nestor.astro` renders it and `Device.astro` puts it in a
body; `scripts/live.ts` makes the hero and the docked one react to the visitor. Sections give the
docked one its mood with `data-mood` (and a line with `data-say`). Its stills are published at
`/character/*` (avatars, tiles, PNG sizes) and drawn into the favicon and sharing images.

## Conventions

- **One identity.** `src/styles/tokens.css` is a copy of `nestor/web/src/styles/tokens.css`.
  Change the admin's file, then copy it.
  Paper and ink, one ember accent, Fraunces for display, Instrument Sans for text, IBM Plex Mono
  for data, hairlines, corner marks and the Bayer dither (from the character package, as in the admin).
- **No sentence in a component.** Every visible word is a Fluent message in
  `src/locales/{en,fr}/*.ftl`, read with `t("id")` (or `t.html("id")` for `*em*`, `**strong**`,
  `` `code` ``). `tests/no-literals.test.ts` fails on literal text nodes and on literal `alt`,
  `aria-label`, `title`; `tests/i18n.test.ts` checks both languages hold the same messages and every
  id a component names. A missing message fails the build. Islands get their words as props.
- **French typography**: narrow no-break spaces before `: ; ? ! »` and after `«`, `’` for apostrophes.
- **Honesty.** No figures from local benches or proofs of concept, anywhere. The home page shows
  what Nestor is designed to do; the developers' page marks anything not built as planned
  (the services: `status` in `lib/integrations.ts`, shown as a "planned" badge on both pages).
- **Motion** is transform and opacity only, triggered by IntersectionObserver, never scroll
  handlers that write layout. Everything reads in full without JavaScript, and under
  `prefers-reduced-motion` nothing moves or plays by itself (`e2e` checks it).
- **Anti-slop**: no gradients or glows, no emoji, no eyebrows above titles, no coloured side borders,
  no stat tiles; numbers in `tabular-nums`; a description only when it says something.
- Brand marks come from `lib/brands.ts` (nominative use): Simple Icons (CC0) for services, Lobe Icons
  (`@lobehub/icons-static-svg`, MIT) for AI providers, the admin's lucide glyph for what is not a
  brand, a text monogram for a brand in neither set; never inline elsewhere, never redrawn. In ink by
  default, the brand's colour on hover.

## Refreshing the media

The pictures are the real admin (`nestor/web`) on its mock API, captured with Playwright.

```bash
cd ../nestor/web && pnpm dev --port 5190 --strictPort &      # the admin on its mocks
node scripts/capture-admin.mjs     # → .media-raw/ (≈ 6 min; ONLY=journal THEMES=dark LOCALES=en for a subset)
node scripts/encode-media.mjs      # → src/assets/captures/*.webp, public/media/*, src/data/media.json
```

Shots: `journal`, `connection`, `satellites`, `system`; clips shown: `journal-live` (home)
and `journal-filters` (developers) — each in `light`/`dark` and `en`/`fr`. `command` and `mobile`
are captured too; encode them with `ONLY=command,mobile` if a section needs them. Sections render
only what `media.json` lists, so the site builds without them. Content people wrote in the mock
household stays French in the English captures; that is expected.

## What the build takes from the server package

The site serves files that ship in the server package (`nestor-home` on PyPI), at one release
pinned in `NESTOR_SERVER` at the top of `scripts/server.mjs`. That Astro integration runs the
package through uvx before `astro dev` and `astro build` and writes into `public/` (git-ignored):

- **The protocol's schemas**, served where their `$id` points
  (`/schemas/satellite/<version>/<message>.json`): `nestor satellites schemas` writes them and each
  file lands at its `$id`'s path, so the version in the URL is the one the schemas declare.
- **The OAuth relay** (`nestor/admin/static/relay/` in the package, copied unchanged to
  `public/redirect/`): the admin's default `relay_url`, `https://nestorhome.dev/redirect/oauth`.
  An admin not served over HTTPS sends providers there; the page reads `state`
  (`<state>.<base64url(callback)>`) and forwards the browser to that admin's
  `/connections/callback` with the query. Providers have that URL registered exactly, without a
  trailing slash, so `deploy/nginx.conf` serves `/redirect/oauth.html` at `location = /redirect/oauth`
  (200, query untouched, `Referrer-Policy: no-referrer`, `no-store`), sends `/redirect/oauth/` there
  with its query, and the page loads `relay.js` beside it. `astro preview` does not do this:
  `e2e/nginx.spec.ts` runs against the site's image (`E2E_NGINX=1`, see the file; CI does it).
  Change the page in the server, release it, then raise `NESTOR_SERVER`.

Raise `NESTOR_SERVER` when a server release changes the protocol or the relay, and update the
manifest shown in `sections/Satellites.astro` and its schema link if the protocol version changes.
Without uv the build stops and says so.
