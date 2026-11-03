---

title: Quickstart
description: From nothing to a first conversation with Nestor on your computer, in writing, in about ten minutes.
---

Get a first answer from Nestor in your terminal, the shortest way: uv, a hosted model, text only.
Other ways are in [Installation](/docs/install/).

You need:

- macOS or Linux with [uv](https://docs.astral.sh/uv/getting-started/installation/);
- a model provider key: [OpenRouter](https://openrouter.ai/keys) by default, or any
  OpenAI-compatible server, local ones included ([Models](/docs/models/)).

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

`nestor init` asks for names, the language, the time zone and the model; Enter keeps each default.
It then creates your admin login (a password of 10 characters or more).

It writes `nestor.yaml` (the configuration), `.env` (the keys) and `state/` (the database), and
never overwrites an existing one.

### 3. Add the model key

Fill in `MODEL_API_KEY` in `.env`:

```ini
MODEL_API_KEY=sk-or-...
```

Telegram is optional: leave `TELEGRAM_BOT_TOKEN` empty.

### 4. Check and start

```bash
nestor check
nestor run
```

`nestor check` names what is missing, such as an empty key. `nestor run` starts the server: leave it
running.

## Open the admin

Open [http://localhost:8470](http://localhost:8470) and sign in with the login from step 2.

## Talk to it

In a second terminal, in the same folder, create a pairing code for a terminal satellite:

```bash
nestor satellites add --room office --name Terminal
```

Pass the URI it prints (`nestor+http://…:8471/?code=…`) to the satellite:

```bash
uvx nestor-satellite run --room office --text --no-voice --pairing-uri 'nestor+http://…'
```

Type a message and press Enter. The answer prints in the terminal and the turn shows in the admin’s
journal. Later runs reconnect without a code.

## Next

- Talk to it aloud, or on Telegram: [Channels and voice](/docs/channels/).
- Let it see who is home and drive the house: [Home and services](/docs/connections/).
- What happened during that turn: [How the agent works](/docs/agent/).
