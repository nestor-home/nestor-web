# AGENTS.md

The website of Nestor. Read this before changing anything; the product's own rules are in the
`nestor` repository (`AGENTS.md`, `CADRAGE.md`, `ROADMAP.md`).

## Commands

```bash
pnpm install                               # also installs the pre-push hook (lefthook.yml: Biome, astro check)
pnpm lint && pnpm typecheck && pnpm test   # Biome, astro check, Vitest (files in a random order:
                                           # `pnpm test --sequence.seed=<seed>` replays a printed seed)
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
├── pages/            home (/ and /fr/), docs (/docs/…, /fr/docs/…), 404, og/[page]-[locale].png,
│                     favicon*, robots.txt
├── content/docs/     the documentation: one Markdown file per page and locale
├── components/
│   ├── Home.astro        the home page: hero, what Nestor does (bento), Reachy in 3D, integrations,
│   │                     how to start
│   ├── sections/         one file per section: Hero, Story, Reachy, Works, Cta
│   ├── objects/          what each tile of the story shows, drawn in HTML: Spoken, Watch, Phone,
│   │                     Satellites, Room, Trace, Models, Local
│   ├── Tile.astro, Bento.astro  the one frame of every bento, and its grid
│   ├── Nestor.astro      the character (one drawing, its states, a gaze)
│   ├── docs/             the documentation's pieces: steps, cards, callouts, tabs, provider mosaics,
│   │                     diagrams
│   └── *.astro           shared pieces: Header, Footer, Brand, CopyCommand, Dither, Tie…
├── layouts/          Base (head, header, footer) and Docs (sidebar, text, sections, prev/next)
├── scripts/site.ts   the one global script: theme, the menu sheet, dither canvases, the header's
│                     hairline, the section being read in a table of contents, reveals (which also
│                     start the story's objects), copy buttons, tabs (docs.ts: code copy buttons)
├── locales/<lang>/   the words, in Fluent (.ftl), one file per section
├── i18n/             the Fluent loader (`translator(locale)`)
├── lib/              data and logic: links, brands, integrations, providers, docs, OG pictures
├── styles/           tokens.css (a verbatim copy of the admin's) and global.css
└── assets/brands/    official marks no icon set has
public/schemas/       the satellite protocol's JSON Schemas, generated at build (not committed)
public/redirect/      the OAuth relay page, copied from the server package at build (not committed)
```

## Two places, one job each

The home page is about **use**: the promise and the final experience of Nestor, told through moments
almost every household lives (no niche scenarios, no invented brands, shops, prices or dates), and
people named by their role (Mom, Grandma, "you"), never by a first name the reader does not know. It
goes in this order: the hero (title, lede, buttons; Nestor in the middle with a few of its bodies and
messages around it); what Nestor does in a home, as one bento (`components/sections/Story.astro`:
each tile an object drawn in HTML from `components/objects/`, then one sentence in ink and one in
grey); a satellite's use case (Reachy Mini in 3D, `sections/Reachy.astro`, `scripts/reachy.ts`, the
model in `public/models/` built by `scripts/reachy-model/`, credited CC BY-SA-NC to Pollen Robotics);
what it works with (a bento of logo groups); how to start (a bento: install, what it takes, three ways
to build on it). Every bento uses `Tile.astro` in `Bento.astro`, the same frame everywhere. The header
lists the home page's sections, then the docs. No pictures of the admin, no film. No contract names,
no benchmarks, no internal status, no vendor comparisons; nothing presented as working that is not.
The 3D library (three.js) is the page's only library, loaded only when its section comes near.

Everything else belongs to the **documentation** (`/docs/`, `/fr/docs/`): how it works (the agent,
its memory, the journal and its events), how to do things (install, configure, pair, write a
satellite or a plugin) and the protocol itself. It is the single source: the protocol specification
lives there (the `nestor` repository only links to it), and SDK READMEs stay short and link to their
page. There is no developers' page: `/developers/` and `/fr/developpeurs/` redirect to the docs.
Before adding a section to the home page, check the docs do not already say it; link to them.

## The documentation

- The structure, in `DOC_GROUPS` (`src/lib/docs.ts`, the reading order and the sidebar): **Start**
  (Introduction with cards, Quickstart, Installation), **How it works** (concepts, diagram first),
  **Configure** (configuration, models, channels, voice, updates), **Connect** (Home Assistant,
  accounts, tools, executors), **Satellites** (with cameras, the protocol, schemas, conformance),
  **SDKs**, **Project**. One subject per page, short pages; each fact has one page, others link to it.
- Short and visual, like Raycast's or Linear's docs: procedures are `<Steps>` (a Markdown ordered
  list inside), "where next" and "the parts of X" are `<Cards>`/`<Card>`, options, defaults, events,
  capabilities and commands are tables, a rare aside is a `<Callout>` (all in
  `src/components/docs/`). Prose only for what a structure cannot say.
- The docs have their own mode (`area="docs"` on `Base`): mono headings with their Markdown marks,
  code on ink with its language, the navigation as paths, a dot grid.
- For language models (llmstxt.org): `/llms.txt` and `/fr/llms.txt` index the pages, each page is
  also served as Markdown beside it (`/docs/<slug>.md`, `/docs/index.md` for the first), and
  `/llms-full.txt` holds them all; `src/lib/markdown.ts` turns the components into Markdown, so a
  new component needs its rule there (`tests/markdown.test.ts`).
- A page opens with one or two sentences saying what it gives the reader, then goes in the order
  they will act. Every option shown exists in the server (read its code before writing), and every
  command is run before it is written.
- One Markdown file per page and locale in `src/content/docs/<locale>/` (`index.md` for the first
  page; `.mdx` only where a page holds a component). Provider mosaics (`Providers.astro`, on
  `models.mdx`, `channels.mdx` and `voice.mdx`) take their tiles from `lib/providers.ts` (models, speech, and
  channels, whose messaging services are the home page's list in `lib/integrations.ts`); each
  available one's setup is a `<ProviderSetup>` in the page, and `tests/docs.test.ts` checks both
  languages give one to each. Choices shown one at a time (the ways to install) are `<Tabs set>` with
  a `<Tab>` each, their sets in `TAB_SETS`; a tab opens from the address (`#install-docker`).
  The home page shows the docs' own commands, found by the tag on their fence (`lib/site.ts`):
  the quickstart's ` ```bash quickstart ` blocks are its install box, the install page's one
  ` ```bash docker-quickstart ` block its Docker steps; tag the same blocks in every language. A moved page keeps its old address in `redirects`
  (`astro.config.mjs`). A page needs a `title` and a `description`; `tests/docs.test.ts` fails on a
  page missing in a locale, a file outside the reading order, a link to the other language's docs,
  or an em-dash.
- Prose lives in the content files, written for each language (French typography as in the
  catalogues); the layout's words (sidebar groups, "On this page"…) are Fluent messages in
  `docs.ftl`.
- Diagrams are Astro components in `src/components/docs/diagrams/`, drawn in HTML on the site's
  tokens (no Mermaid, no images): every word a Fluent message in `diagrams.ftl`, the layout chosen
  by the board's own width (a container query), so a figure reads in the article's column and on a
  phone. Their shared pieces (board, node, region, arrow, event) are the `.dg-*` classes in
  `src/styles/diagrams.css`, which `Figure.astro` loads (only pages with a figure get it), and every
  figure follows the same convention: a numbered `Figure` with a caption
  that says what to read; one ink node (`is-core`, what it is about); ember (`is-hot`) for the path
  it tells; dashed (`is-quiet`, on a node or an arrow) for what runs only when allowed, asked or
  planned; boxes are `.dg-node` (with `is-hot` for an ember border), small data `.dg-data`, lists
  inside a figure need no reset; arrows drawn only by `.dg-arrow` (`is-right`, `is-left`,
  `is-down`, `is-flow`), and a figure with `is-flow` arrows goes across at 40rem, where they turn;
  fluid columns only, so nothing leaves the board at any width. Never an ASCII diagram in a code block:
  a `text` block holds real output (a URI, a command's lines), nothing drawn.
- Code blocks are highlighted at build (Shiki's `css-variables` theme, coloured by `.doc-prose` in
  `global.css`) and get a copy button. Commands in the docs are run before they are written.
- A record, an event or a plugin shown in the docs is produced by the server's code, not written by
  hand: build the event and print `to_record()`, run the plugin with `nestor check`.
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
(`Tie.astro`). The copy uses no em-dashes (a test checks the catalogues). Eight states
mirror the product's: `idle`, `listening`, `thinking`, `speaking`, `laughing`, `sleeping`,
`working`, `concerned`. On the site, `Nestor.astro` renders it (the first page of the docs, and
speaking in the story's first object). Its stills are published at
`/character/*` (avatars, tiles, PNG sizes) and drawn into the favicon and sharing images.

## Conventions

- **One identity.** `src/styles/tokens.css` is a copy of `nestor/web/src/styles/tokens.css`.
  Change the admin's file, then copy it.
  Paper and ink, one ember accent, Fraunces for display, Instrument Sans for text, IBM Plex Mono
  for data, hairlines, corner marks and the Bayer dither (from the character package, as in the admin).
- **No sentence in a component.** Every visible word is a Fluent message in
  `src/locales/{en,fr}/*.ftl`, read with `t("id")`. `tests/no-literals.test.ts` fails on literal
  text nodes and on literal `alt`, `aria-label`, `title`; `tests/i18n.test.ts` checks both languages
  hold the same messages, every id a component names, and no message nothing asks for. A missing
  message fails the build.
- **French typography**: narrow no-break spaces before `: ; ? ! »` and after `«`, `’` for apostrophes.
- **Honesty.** No figures from local benches or proofs of concept, anywhere. The home page shows
  what Nestor is designed to do, and marks a service not built yet as planned (`status` in
  `lib/integrations.ts`, shown as a "planned" badge). The docs describe only what the server does.
- **Type scale.** Font sizes are Tailwind's steps (`text-xs`… or `var(--text-xs)` in a style
  block), plus the few declared once in `global.css`'s `@theme` (`text-2xs` for micro labels, the
  wordmark, the hero); `tests/type-scale.test.ts` fails on an arbitrary size in a component. The
  header's height and its layer are tokens there too (`--header-h`, `--z-header`).
- **Motion** is transform and opacity only, triggered by IntersectionObserver, never scroll
  handlers that write layout. An element with `data-reveal` fades in once seen (the script sets
  `data-shown`); a story object animates its inside from `data-shown`, only under `.js` and
  `prefers-reduced-motion: no-preference`, so it reads in full at once without JavaScript and under
  reduced motion, where nothing moves by itself (`e2e` checks all three).
- **Anti-slop**: no gradients or glows, no emoji, no eyebrows above titles, no coloured side borders,
  no stat tiles; numbers in `tabular-nums`; a description only when it says something.
- Brand marks come from `lib/brands.ts` (nominative use): Simple Icons (CC0) for services, Lobe Icons
  (`@lobehub/icons-static-svg`, MIT) for AI providers, the admin's lucide glyph for what is not a
  brand, a text monogram for a brand in neither set; never inline elsewhere, never redrawn. In ink by
  default, the brand's colour on hover.

## Writing

Copy reads as written by a careful person, in each language on its own (French is written in French,
not translated). Every sentence says something concrete: subject, verb, object; "is" and "has" over
"serves as" or "offers"; an example over an adjective. Hunt for these and rewrite them:

- fake contrasts ("not X but Y", "rather than"), triplets by reflex, slogans in fragments;
- inflated words (key, seamless, robust, powerful, « véritable », « au cœur de ») and intensifiers;
- trailing participles (", ensuring…", « , permettant… »), warm-ups and recaps (« Concrètement »);
- em dashes, Title Case headings, rhetorical questions, French calques (« faire sens »).

| Before                                                           | After                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Nestor integrates rather than reimplements.                      | Nestor reimplements none of it.                                                |
| A catalogue, consent at the provider, a switch per tool.         | Pick a service, consent at the provider, then switch on the tools you want.    |
| Cloud services are optional by design                            | Cloud services are optional                                                    |
| Consultable, corrigeable et supprimable depuis l’administration. | Vous pouvez le consulter, le corriger ou le supprimer depuis l’administration. |
| Une capacité facultative absente dégrade                         | Sans une capacité facultative, il continue avec moins                          |

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
schema links of the docs' `satellites/schemas` page if the protocol version changes.
Without uv the build stops and says so.
