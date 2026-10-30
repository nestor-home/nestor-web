# AGENTS.md

The website of Nestor. Read this before changing anything; the product's own rules are in the
`nestor` repository (`AGENTS.md`, `CADRAGE.md`, `ROADMAP.md`).

## Commands

```bash
pnpm lint && pnpm typecheck && pnpm test   # Biome, astro check, Vitest
pnpm build && pnpm e2e                     # Playwright on the built site (starts a preview on 4380)
E2E_BASE=http://localhost:4321 pnpm e2e    # against a server already running
```

All of them must pass; CI runs them on every push and pull request. `.github/workflows/deploy.yml`
publishes to GitHub Pages, manually for now (see the comment at its top for the domain).

## Layout

```text
src/
├── pages/            index (en), fr/index, 404, og/[locale].png, favicon*, robots.txt — that's all
├── components/
│   ├── Home.astro    the page, section by section, in reading order
│   ├── sections/     one file per section of the story
│   └── *.astro       shared pieces: Shot, Clip, Dither, Brand, CopyCommand, Wordmark…
├── islands/          React, only where interaction needs state (the architecture explorer)
├── scripts/site.ts   the one global script: reveals, story stepper, pairing, tabs, copy, theme
├── locales/<lang>/   the words, in Fluent (.ftl), one file per section
├── i18n/             the Fluent loader (`translator(locale)`)
├── lib/              data and logic: links, brands, dither, Shiki, media index, OG pictures
├── styles/           tokens.css (a verbatim copy of the admin's) and global.css
├── assets/captures/  admin screenshots (WebP sources; Astro derives AVIF/WebP sizes)
└── data/             media.json (what was captured), snippets/ (code from the SDK READMEs)
public/media/         admin recordings (mp4 + webm + poster) and the Reachy twin clip
public/schemas/       the satellite protocol's JSON Schemas, served where their `$id` points
```

## Conventions

- **One identity.** `src/styles/tokens.css` is a copy of `nestor/web/src/styles/tokens.css`; a
  test fails if they drift (when the sibling checkout exists). Change the admin's file, then copy it.
  Paper and ink, one ember accent, Fraunces for display, Instrument Sans for text, IBM Plex Mono
  for data, hairlines, corner marks and the Bayer dither (`lib/dither.ts`, same as the admin's).
- **No sentence in a component.** Every visible word is a Fluent message in
  `src/locales/{en,fr}/*.ftl`, read with `t("id")` (or `t.html("id")` for `*em*`, `**strong**`,
  `` `code` ``). `tests/no-literals.test.ts` fails on literal text nodes and on literal `alt`,
  `aria-label`, `title`; `tests/i18n.test.ts` checks both languages hold the same messages and every
  id a component names. A missing message fails the build. Islands get their words as props.
- **French typography**: narrow no-break spaces before `: ; ? ! »` and after `«`, `’` for apostrophes.
- **Honesty.** Only measured numbers, with their source and date (the proof of concept's benches);
  anything not in the repository is marked as planned. The roadmap section is written from
  `nestor/ROADMAP.md` and the repository's history — update both together.
- **Motion** is transform and opacity only, triggered by IntersectionObserver, never scroll
  handlers that write layout. Everything reads in full without JavaScript, and under
  `prefers-reduced-motion` nothing moves or plays by itself (`e2e` checks it).
- **Anti-slop**: no gradients or glows, no emoji, no eyebrows above titles, no coloured side borders,
  no stat tiles; numbers in `tabular-nums`; a description only when it says something.
- Brand marks come from `lib/brands.ts` (Simple Icons, nominative use), never inline elsewhere.

## Refreshing the media

The pictures are the real admin (`nestor/web`) on its mock API, captured with Playwright.

```bash
cd ../nestor/web && pnpm dev --port 5190 --strictPort &      # the admin on its mocks
node scripts/capture-admin.mjs     # → .media-raw/ (≈ 6 min; ONLY=journal THEMES=dark LOCALES=en for a subset)
node scripts/encode-media.mjs      # → src/assets/captures/*.webp, public/media/*, src/data/media.json
../playground/reachy-twin/.venv/bin/python scripts/render-twin.py   # the Reachy twin clip (MuJoCo, offscreen)
```

Shots: `home`, `journal`, `connection`, `satellites`, `system`; clips: `journal-live`,
`journal-filters`, `command`, `mobile` — each in `light`/`dark` and `en`/`fr`. Sections render
only what `media.json` lists, so the site builds without them. Content people wrote in the mock
household stays French in the English captures; that is expected.

The code examples come from the SDK READMEs and the schemas from the core:

```bash
node scripts/sync-snippets.mjs     # needs the sibling checkouts (../nestor-satellite-*, ../nestor)
```
