---

title: Configuration
description: The files Nestor reads, what each section of nestor.yaml sets, where keys go, and how a change takes effect.
---

Nestor is set in `nestor.yaml`, with its keys in a `.env` next to it; `nestor init` writes both.
Each part has its own page: [Models](/docs/models/), [Channels and voice](/docs/channels/),
[Home and services](/docs/connections/).

## The files

| File          | Holds                                                                           | Written by                       |
| ------------- | ------------------------------------------------------------------------------- | -------------------------------- |
| `nestor.yaml` | the configuration: who lives here, which models, which channels                 | `nestor init`, you, or the admin |
| `.env`        | the keys the configuration calls with `${NAME}`, readable by you only           | `nestor init`, then you          |
| `state/`      | the database: journal, memories, accounts, paired devices, the vault of secrets | Nestor (its `data_dir`)          |

`nestor` reads both at each start, from the current folder or the file `nestor -c <file>` names. A
variable set in the environment wins over `.env`. Back up `state/` and `.env` together: one holds
the secrets, the other their key.

## A first configuration

`nestor init` writes this for one person with the satellites’ voice (comments removed):

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

Without the voice, the `voice` block is commented out and a `telegram` channel is added. Home
Assistant is there too, commented out.

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
| `updates`    | whether the admin says when a newer release is out                              | [below](#updates)                                                        |

## The household

Each person has an `id`, a `name`, and the `accounts` that identify them:

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

- `telegram:<id>`: their Telegram user id. Messages from unknown accounts are ignored, and the
  server’s log prints their id.
- `satellites:*`: whatever is said or typed on a satellite is theirs. Give it to one person only.
- `reach`: where to write to them when they are away or it is quiet hours, such as
  `telegram:123456789`.
- `may_message`: the person ids they may have the assistant write to; `"*"`, everyone, by default.

## Language and time

By default, Nestor speaks English and keeps UTC. To switch to French:

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

`${NAME}` reads `.env` or the environment. `${secret:name}` reads the vault, encrypted in
`state/`. Store a secret from the admin or with `nestor secrets set` (typed without echo):

```bash
nestor secrets set openrouter   # then, in nestor.yaml: api_key: ${secret:openrouter}
```

`.env` is simpler to start with; the vault keeps no key in clear on disk. `NESTOR_SECRET_KEY`, in
`.env`, opens the vault: never change it, or the stored secrets become unreadable.

## The admin

- `host`: `0.0.0.0` opens it to the network at `http://<the machine’s address>:8470`,
  `127.0.0.1` keeps it to the machine.
- `public_url`: its address behind a reverse proxy, such as `https://nestor.example.org`.

Accounts live in `state/`, not in the file.

## Updates

```yaml
updates:
  check: true # read the release feed once a day; false: never
```

`feed` is the address of the release feed, GitHub’s by default. Nestor only reads it: nothing is
installed, and nothing is sent but the request. To update, see
[Installation](/docs/install/#updates).

## Applying a change

Nestor reads its configuration at start. After a change, check it, then restart Nestor:

```bash
nestor check   # validates the file and builds every part, without starting them
```

The admin’s **Configuration** page edits the same file. It validates each change, keeps the
previous version in `state/config-history/`, stores typed keys in the vault, and says when to
restart.
