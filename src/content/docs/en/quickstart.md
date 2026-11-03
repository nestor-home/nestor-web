---

title: Quickstart
description: From nothing to a first conversation with Nestor on your computer, in writing, in about ten minutes.
---

This page runs Nestor on your computer and has a first conversation with it from a terminal. It
takes the shortest way: uv, a hosted model, writing only. [Installation](/docs/install/) covers pip,
Docker and a server that stays on.

You need:

- macOS or Linux with [uv](https://docs.astral.sh/uv/getting-started/installation/);
- a key for a model provider. The default is [OpenRouter](https://openrouter.ai/keys); any
  OpenAI-compatible server works, a local one too (see [Models](/docs/models/)).

## Run the server

### 1. Install Nestor

```bash
uv tool install nestor-home
```

### 2. Write a first configuration

```bash
mkdir nestor && cd nestor
nestor init
```

`nestor init` asks for the assistant’s name, your first name, the household’s language (`en` or
`fr`), its time zone, the model server and the model. Press Enter to keep each default. It then asks
for a login and a password for the admin (10 characters or more).

It writes three things in the folder, and never overwrites one that exists:

- `nestor.yaml`, the configuration;
- `.env`, the keys, readable by you only;
- `state/`, the database, which already holds your owner account.

### 3. Add the model key

Open `.env` and fill in `MODEL_API_KEY`:

```ini
MODEL_API_KEY=sk-or-...
```

Leave `TELEGRAM_BOT_TOKEN` empty for now: Telegram is optional.

### 4. Check and start

```bash
nestor check
nestor run
```

`nestor check` reads the configuration and builds every part without starting them. It names
anything missing, such as an empty key. `nestor run` starts the server; leave it running.

## Open the admin

Open [http://localhost:8470](http://localhost:8470) and sign in with the login from step 2. The
admin shows the household, the configuration, the devices and the journal of what Nestor does.

## Talk to it

Nestor is reached through channels. The quickest is a satellite in your terminal: a device that
sends what you type and prints the answers.

In a second terminal, in the same folder, create a pairing code for it:

```bash
nestor satellites add --room office --name Terminal
```

The command prints a pairing URI, `nestor+http://…:8471/?code=…`. Give it to the satellite:

```bash
uvx nestor-satellite run --room office --text --no-voice --pairing-uri 'nestor+http://…'
```

Type a message and press Enter. The answer comes back in the terminal, and the turn appears in the
admin’s journal. Later runs reconnect without a code.

## Next

- Give it a voice, or reach it on Telegram: [Channels and voice](/docs/channels/).
- Let it see who is home and drive the house: [Home and services](/docs/connections/).
- What happens during that turn: [How the agent works](/docs/agent/).
