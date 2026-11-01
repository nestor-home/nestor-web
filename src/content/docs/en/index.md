---

title: Start
description: Run a Nestor server, choose its providers and open the admin.
---

Nestor is an open-source assistant for the whole household. One agent knows who is home, remembers
each person, drives Home Assistant and speaks up when something matters. You run its server on a
machine that stays on; speakers, tablets and robots pair with it as [satellites](/docs/satellites/).

Nestor is an early project: expect changes between releases.

## The short way

On a computer with [uv](https://docs.astral.sh/uv/):

```bash
uv tool install nestor-home
mkdir nestor && cd nestor
nestor init
```

`nestor init` asks for the assistant’s name, your first name, a login and a password (10
characters or more), then writes `nestor.yaml`, its secrets in `.env` (readable by you only) and
`state/`, which holds the owner account. It never overwrites a file.

This is Nestor in text: the admin, Telegram, connectors. To talk to it aloud and pair satellites,
install the voice channel with it: `uv tool install 'nestor-home[voice]'`.

The generated configuration uses OpenRouter for the model, and ElevenLabs for the voice channel:
put their keys in `.env`, or pick other providers in [Providers](/docs/providers/). Nestor speaks
English; [Providers](/docs/providers/) also says how to run it in French. Then:

```bash
nestor check   # validates the configuration and builds the adapters
nestor run
```

There is nothing to source: `nestor` reads the `.env` next to its configuration. pip and Docker
work too, see [Install](/docs/install/).

## Open the admin

<!-- PORTS -->

Open the admin in a browser, on the machine’s address, and sign in with the owner’s login. The admin holds the configuration, the household, the satellites
and the journal of everything Nestor did.

## Next

- Install with pip or Docker, upgrade, where everything is kept: [Install](/docs/install/).
- Another model, a local one, Telegram or the voice channel, Nestor in French: [Providers](/docs/providers/).
- Pair a first device: [Satellites](/docs/satellites/).
- Write your own: the SDKs for [Python](/docs/sdks/python/), [TypeScript](/docs/sdks/typescript/)
  and [Rust](/docs/sdks/rust/).
