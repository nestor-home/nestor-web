# AGENTS.md

The website of Nestor. Read this before changing anything; the product's own rules are in the
`nestor` repository (`AGENTS.md`, `CADRAGE.md`, `ROADMAP.md`).

## Commands

```bash
pnpm lint && pnpm typecheck && pnpm test   # Biome, astro check, Vitest
pnpm build && pnpm e2e                     # Playwright on the built site (starts a preview on 4380)
E2E_BASE=http://localhost:4321 pnpm e2e    # against a server already running
```

All of them must pass; CI runs them on every push and pull request. Releases and deployment:
see README.md, Production.

## Layout

```text
src/
├── pages/            home (/ and /fr/), developers (/developers/, /fr/developpeurs/), 404,
│                     og/[page]-[locale].png, favicon*, robots.txt
├── components/
│   ├── Home.astro        the home page: hero, a day at home, why it spoke, six ideas, bodies, start
│   ├── Developers.astro  the developers' page: architecture, a watch through the system,
│   │                     satellites and SDKs, connectors, Home Assistant, speed, journal,
│   │                     security, i18n, self-hosting
│   ├── Nestor.astro      the character (one drawing, six states, a gaze)
│   ├── Device.astro      its bodies: speaker, robot, tablet, laptop, phone, browser tab
│   ├── sections/         one file per section
│   └── *.astro           shared pieces: Shot, Clip, Dither, Brand, CopyCommand, Wordmark…
├── islands/          React, only where interaction needs state (the architecture explorer)
├── scripts/site.ts   the one global script: reveals, scene beats, the character's sequences and
│                     gaze, story stepper, pairing, tabs, copy, theme
├── locales/<lang>/   the words, in Fluent (.ftl), one file per section
├── i18n/             the Fluent loader (`translator(locale)`)
├── lib/              data and logic: links, brands, dither, Shiki, media index, OG pictures
├── styles/           tokens.css (a verbatim copy of the admin's) and global.css
├── assets/captures/  admin screenshots (WebP sources; Astro derives AVIF/WebP sizes)
└── data/             media.json (what was captured), snippets/ (code from the SDK READMEs)
public/media/         admin recordings (mp4 + webm + poster) and the Reachy twin clip
public/schemas/       the satellite protocol's JSON Schemas, served where their `$id` points
```

## Two audiences, two pages

The home page is about **use**: a household's day, what Nestor does for the people in it, the
character, six ideas drawn simply. No contract names, no benchmarks, no internal status, no vendor
comparisons; honesty lives in one place (the "early project" line near Install). Everything
technical — architecture, protocol, SDK code, measured latencies, self-hosting — goes to the
developers' page. Keep it that way when adding content.

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
- **Honesty.** Only measured numbers, with their source and date, and only on the developers'
  page; anything not built is marked as planned there. The scenes show what Nestor is designed to
  do for a household; keep them to capabilities the core has.
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

Shots: `home`, `journal`, `connection`, `satellites`, `system`; clips shown: `journal-live` (home)
and `journal-filters` (developers) — each in `light`/`dark` and `en`/`fr`. `command` and `mobile`
are captured too; encode them with `ONLY=command,mobile` if a section needs them. Sections render
only what `media.json` lists, so the site builds without them. Content people wrote in the mock
household stays French in the English captures; that is expected.

The code examples come from the SDK READMEs and the schemas from the core:

```bash
node scripts/sync-snippets.mjs     # needs the sibling checkouts (../nestor-satellite-*, ../nestor)
```
