---

title: Configuration
description: The files Nestor reads, what each section of nestor.yaml sets, where keys go, and how a change takes effect.
---

Everything Nestor does is set in one file, `nestor.yaml`, with its keys in a `.env` next to it.
`nestor init` writes both; this page explains what is in them. The next pages set each part:
[Models](/docs/models/), [Channels and voice](/docs/channels/), [Home and services](/docs/connections/).

## The files

| File          | Holds                                                                           | Written by                       |
| ------------- | ------------------------------------------------------------------------------- | -------------------------------- |
| `nestor.yaml` | the configuration: who lives here, which models, which channels                 | `nestor init`, you, or the admin |
| `.env`        | the keys the configuration calls with `${NAME}`, readable by you only           | `nestor init`, then you          |
| `state/`      | the database: journal, memories, accounts, paired devices, the vault of secrets | Nestor (its `data_dir`)          |

`nestor` reads `nestor.yaml` in the current folder, or the file `nestor -c <file>` names, and the
`.env` next to it at each start. A variable already set in the environment (the shell, a service
manager, Docker) wins over the file. Back up `state/` and `.env` together: one holds the secrets,
the other the key that opens them.

## A first configuration

This is what `nestor init` writes, without its comments, for a household of one with the
satellites’ voice:

```yaml
data_dir: /home/alex/nestor/state

persona:
  name: Nestor
  locale: en
  language: English
  timezone: Europe/London
  character: |
    You are Nestor, the household's assistant: warm, direct, with a sense of humour.

household:
  - id: alex
    name: Alex
    accounts: ["satellites:*"]

models:
  main:
    kind: openai-compatible
    base_url: https://openrouter.ai/api/v1
    api_key: ${MODEL_API_KEY}
    model: anthropic/claude-haiku-5.5

channels:
  - kind: satellites
    host: 0.0.0.0
    voice:
      speech:
        api_key: ${ELEVENLABS_API_KEY}
        voice_id: GPAQQPp9dazaB2bl4zg9
        language: en

admin:
  host: 0.0.0.0
  port: 8470
```

Without the voice, the `voice` block stays commented out and a `telegram` channel is added. The
file also carries Home Assistant, commented out, ready to fill in.

## The sections

Only `persona`, `household`, `models` and `channels` are required.

| Section      | Sets                                                                            | Explained in                                                             |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `persona`    | the assistant’s name and character, the household’s language and time zone      | [below](#language-and-time)                                              |
| `household`  | the people, and how each channel recognises them                                | [below](#the-household)                                                  |
| `models`     | the language models, under names you choose                                     | [Models](/docs/models/)                                                  |
| `agent`      | which model answers aloud, in writing, and on wake-ups                          | [Models](/docs/models/#roles)                                            |
| `memory`     | how much each turn recalls, the summaries’ model, search by meaning             | [Models](/docs/models/#search-by-meaning), [Memory](/docs/agent/memory/) |
| `channels`   | Telegram, the satellites and their voice                                        | [Channels and voice](/docs/channels/)                                    |
| `presence`   | who is home and in which room, from Home Assistant                              | [Home and services](/docs/connections/#home-assistant)                   |
| `tools`      | MCP servers whose tools the agent may use: Home Assistant’s devices, and others | [Home and services](/docs/connections/#mcp-servers)                      |
| `executors`  | agents that take on longer tasks                                                | [Home and services](/docs/connections/#longer-tasks)                     |
| `initiative` | quiet hours, and the room to speak in when it only knows someone is home        | [Initiative](/docs/agent/initiative/)                                    |
| `watches`    | the model that sorts incoming mail for the watches                              | [Home and services](/docs/connections/#mail-and-watches)                 |
| `admin`      | the admin’s address and port; without it, there is no admin                     | [below](#the-admin)                                                      |

## The household

Each person has an `id` (used everywhere else in the file), a `name`, and the `accounts` that
identify them on each channel:

```yaml
household:
  - id: alex
    name: Alex
    accounts: ["telegram:123456789", "satellites:*"]
  - id: sam
    name: Sam
    accounts: ["telegram:987654321"]
    may_message: [alex]
```

- `telegram:<id>` is their Telegram user id. A message from an unknown account is ignored, and the
  server’s log prints its id.
- `satellites:*` means anything said or typed on a satellite is taken as theirs. In a household of
  several, give it to one person only.
- `reach`, an address such as `telegram:123456789`, is where to write to them when speaking is not
  right: they are away, or it is quiet hours.
- `may_message` lists whom they may have the assistant write to: person ids, or `"*"` for everyone,
  the default.

## Language and time

Without these settings, Nestor speaks English and keeps UTC. `nestor init` sets them from your
answers. To switch an existing configuration to French:

```yaml
persona:
  locale: fr # its fixed phrases, and the admin's default language
  language: French # the language the model writes in
  timezone: Europe/Paris # the household's clock: quiet hours, reminders, dates in memories

channels:
  - kind: satellites
    voice:
      speech:
        language: fr # the language the voice transcribes
```

## Keys and secrets

A value written `${NAME}` comes from `.env` or the environment. A value written `${secret:name}`
comes from the vault: encrypted in `state/`, set with `nestor secrets set <name>` (typed without
echo) or from the admin, listed with `nestor secrets list`.

```bash
nestor secrets set openrouter   # then, in nestor.yaml: api_key: ${secret:openrouter}
```

`.env` is simpler to start with. The vault keeps no key in clear on disk, and the admin can change
them. `NESTOR_SECRET_KEY`, in `.env`, opens the vault: `nestor init` generates it. Never change it,
or the secrets already stored can no longer be read.

## The admin

The admin listens on port 8470. `host: 0.0.0.0` lets other devices of the network open it at
`http://<the machine’s address>:8470`; `127.0.0.1` keeps it to the machine itself. `public_url` is
its address as the household’s browsers reach it, behind a reverse proxy for instance
(`https://nestor.example.org`). Who may sign in is not in the file: accounts live in `state/`
(`nestor init`, or `nestor accounts create-owner`).

## Applying a change

Nestor reads its configuration when it starts. After editing `nestor.yaml` or `.env`:

```bash
nestor check   # validates the file and builds every part, without starting them
```

Then restart Nestor. The admin’s **Configuration** page edits the same file: it checks a change
before writing it, keeps the previous version in `state/config-history/`, sends the keys you type
to the vault, and shows when a restart is needed.
