---

title: Configuration
description: The map of nestor.yaml, the files beside it, and how a change takes effect.
---

Nestor is set in one file, `nestor.yaml`, written by `nestor init`.

## The files

| File          | Holds                                                                        | Written by                       |
| ------------- | ---------------------------------------------------------------------------- | -------------------------------- |
| `nestor.yaml` | who lives here, which models, which channels                                 | `nestor init`, you, or the admin |
| `.env`        | the keys the configuration calls with `${NAME}`, readable by you only        | `nestor init`, then you          |
| `state/`      | the database: journal, memories, accounts, paired devices, the secrets vault | Nestor (its `data_dir`)          |

Nestor reads the current folder, or `nestor -c <file>`. The environment wins over `.env`. Back up
`state/` and `.env` together: one holds the secrets, the other their key.

## The sections

Only `persona`, `household`, `models` and `channels` are required.

| Section      | Sets                                                                        | Page                                               |
| ------------ | --------------------------------------------------------------------------- | -------------------------------------------------- |
| `persona`    | the assistant’s name and character, the household’s language and time zone  | [Language and time](#language-and-time)            |
| `household`  | the people, and the accounts channels recognise them by                     | [The household](#the-household)                    |
| `models`     | every model, under names you choose                                         | [Models](/docs/models/)                            |
| `agent`      | which model holds each role                                                 | [Roles](/docs/models/#roles)                       |
| `memory`     | how much each turn recalls, search by meaning                               | [Memory](/docs/agent/memory/)                      |
| `channels`   | the admin’s chat, messaging apps, satellites                                | [Channels](/docs/channels/), [Voice](/docs/voice/) |
| `home`       | Home Assistant: who is home, in which room, its actions                     | [Home](/docs/home/)                                |
| `tools`      | web search, weather, maps, MCP servers                                      | [Tools](/docs/tools/)                              |
| `executors`  | agents that take on longer tasks                                            | [Executors](/docs/executors/)                      |
| `initiative` | quiet hours, and where to speak when it only knows someone is home          | [Initiative](/docs/agent/initiative/)              |
| `voices`     | the speaker model that recognises who speaks to a satellite                 | [Speakers](/docs/agent/speakers/)                  |
| `watches`    | the model that sorts incoming items for the watches                         | [Accounts](/docs/accounts/)                        |
| `connectors` | the services the admin connects accounts to; every installed one by default | [Accounts](/docs/accounts/)                        |
| `inbound`    | news feeds, web pages and webhooks the watches follow                       | [Tools](/docs/tools/)                              |
| `admin`      | the admin’s address and port; without it, there is no admin                 | [The admin](#the-admin)                            |
| `updates`    | whether the admin says when a newer release is out                          | [Updates](/docs/updates/)                          |
| `prices`     | where a call’s price comes from when the provider does not say              | [Costs](/docs/costs/)                              |

## The household

```yaml
household:
  - id: alex
    name: Alex
    accounts: ["telegram:123456789"]
  - id: sam
    name: Sam
    accounts: ["telegram:987654321"]
    may_message: [alex]
```

| Key           | What it does                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `accounts`    | who they are on each channel, such as `telegram:<user id>`; messages from unknown accounts are ignored and their id is logged |
| `reach`       | where Nestor writes to them when it does not say it aloud, such as `telegram:123456789`                                       |
| `may_message` | the people they may have Nestor write to; `"*"`, everyone, by default. They can always write to themselves                    |

Satellites have no account ([Speakers](/docs/agent/speakers/)).

## Language and time

English and UTC by default. In French:

```yaml
persona:
  locale: fr # its fixed phrases, and the admin's default language
  language: French # the language the model writes in
  timezone: Europe/Paris # quiet hours, reminders, dates in memories
```

The voice hears the language of its [transcription model](/docs/voice/).

## Keys and secrets

| Written          | Reads                            |
| ---------------- | -------------------------------- |
| `${NAME}`        | `.env`, or the environment       |
| `${secret:name}` | the vault, encrypted in `state/` |

Store a secret from the admin, or:

```bash
nestor secrets set openrouter   # then, in nestor.yaml: api_key: ${secret:openrouter}
```

`NESTOR_SECRET_KEY`, in `.env`, opens the vault. Never change it, or the secrets become unreadable.

## The admin

| Key          | Default     | What it does                                                             |
| ------------ | ----------- | ------------------------------------------------------------------------ |
| `host`       | `127.0.0.1` | `0.0.0.0` opens it to the network at `http://<machine address>:8470`     |
| `port`       | `8470`      | its port                                                                 |
| `public_url` |             | its address behind a reverse proxy, such as `https://nestor.example.org` |

Invite someone from **Accounts**: you get a link to send. Each account has a role:

| Role   | May                                                                     |
| ------ | ----------------------------------------------------------------------- |
| owner  | everything, other owners included; there is always at least one         |
| admin  | run the household’s assistant, without touching the owners              |
| member | see and manage their own conversations, memories, tasks and connections |
| guest  | see what the assistant knows about them                                 |

## Applying a change

Nestor reads its configuration at start:

```bash
nestor check     # validates the file and builds every part, without starting them
nestor restart   # restarts the running instance
```

The admin's **Configuration** page edits the same file, keeps the previous version in
`state/config-history/`, stores typed keys in the vault, and says when to restart.
