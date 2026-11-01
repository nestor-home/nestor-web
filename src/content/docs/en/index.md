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
uv tool install 'nestor-home[voice]'
mkdir nestor && cd nestor
nestor init
```

`nestor init` asks for the assistant’s name, your first name, a login and a password (10
characters or more), then writes `nestor.yaml`, its secrets in `.env` (readable by you only) and
`state/`, which holds the owner account. It never overwrites a file.

Its configuration uses OpenRouter for the model and ElevenLabs for the voice: put the two keys in
`.env`, or pick other providers in [Providers](/docs/providers/). Then:

```bash
nestor check   # validates the configuration and builds the adapters
nestor run
```

There is nothing to source: `nestor` reads the `.env` next to its configuration. pip and Docker
work too, see [Install](/docs/install/).

## Open the admin

Go to [http://localhost:8080](http://localhost:8080), or the machine’s address on port 8080, and
sign in with the owner’s login. The admin holds the configuration, the household, the satellites
and the journal of everything Nestor did.

## Next

- Install with pip or Docker, upgrade, where everything is kept: [Install](/docs/install/).
- Another model, a local one, or no voice at all: [Providers](/docs/providers/).
- Pair a first device: [Satellites](/docs/satellites/).
- Write your own: the SDKs for [Python](/docs/sdks/python/), [TypeScript](/docs/sdks/typescript/)
  and [Rust](/docs/sdks/rust/).
