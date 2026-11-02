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

`nestor init` asks for the assistant’s name, your first name, the household’s language (`en` or
`fr`), its time zone (this machine’s by default), the model server and the model, then a login and a
password (10 characters or more). It writes `nestor.yaml`, its secrets in `.env` (readable by you
only) and `state/`, which holds the owner account. It never overwrites a file.

This is Nestor in text, on Telegram, with any OpenAI-compatible model: the admin and the connectors
come with it, and so do satellites you type on. To talk to them aloud, install their voice with it:
`uv tool install 'nestor-home[voice]'`. `nestor init` then asks whether you want it; without the
extra, the voice block of `nestor.yaml` stays commented out.

Fill the keys `nestor init` left empty in `.env`: `MODEL_API_KEY` for the model (empty for a local
server such as Ollama), and `TELEGRAM_BOT_TOKEN`, or `ELEVENLABS_API_KEY` for the satellites’ voice.
[Providers](/docs/providers/) says where to get each one. Then:

```bash
nestor check   # validates the configuration and builds the adapters
nestor run
```

`nestor check` names any key still empty. There is nothing to source: `nestor` reads the `.env`
next to its configuration at each start. pip and Docker work too, see [Install](/docs/install/).

## Open the admin

The admin listens on port 8470: open `http://localhost:8470` on the machine itself, or
`http://<its address>:8470` from another device, and sign in with the owner’s login. The admin
holds the configuration, the household, the satellites and the journal of everything Nestor did.
`admin.port` in `nestor.yaml` changes the port.

## Next

- Install with pip or Docker, upgrade, where everything is kept: [Install](/docs/install/).
- Another model, a local one, Telegram or satellites, Nestor in French: [Providers](/docs/providers/).
- Pair a first device: [Satellites](/docs/satellites/).
- Write your own: the SDKs for [Python](/docs/sdks/python/), [TypeScript](/docs/sdks/typescript/)
  and [Rust](/docs/sdks/rust/).
