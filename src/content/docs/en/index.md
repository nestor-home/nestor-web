---

title: Introduction
description: What Nestor does for a household, what it is made of, and where to start in this documentation.
---

Nestor is an open-source assistant for the whole household. You run it on a machine at home that
stays on, and everyone talks to the same assistant: aloud in the kitchen, in writing from the office,
on Telegram when away.

Nestor is an early project: expect changes between releases.

## What it does for you

- **It answers everyone, and knows who is asking.** Each person has their own conversations and
  their own memories; one agent serves the whole home.
- **It remembers.** What you tell it, what was said in past conversations, with dates. It recalls
  what matters on its own at each turn.
- **It drives the house.** Through Home Assistant it knows who is home and can switch, open, read
  and set what Home Assistant controls.
- **It keeps watch.** Ask it to watch your mail for a parcel or a reply: it reads what comes in and
  tells you when something matches.
- **It speaks up at the right moment, to the right person.** A reminder, an answer that arrived
  later, a question for someone else: it finds who should hear it, where, and keeps quiet at night.
- **It keeps a journal.** Every turn, tool call, memory and delivery is written down, with its
  reason. The admin shows it as conversations.

## What it is made of

- **The server**, the Python package `nestor-home`: the agent, its memory, its journal and the
  admin, on ports 8470 (admin) and 8471 (devices).
- **A language model** of your choice, hosted or on your own machine.
- **Channels** to reach it: Telegram, and **satellites**, devices people type on or talk to (a
  Raspberry Pi with a speaker, a tablet on the wall, a Reachy Mini robot).
- **Integrations** it uses: Home Assistant, any MCP server, mail accounts, longer-running agents.

[How the agent works](/docs/agent/) shows how these fit together.

## Where to start

| You want to…                                    | Read                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| try Nestor on your computer in ten minutes      | [Quickstart](/docs/quickstart/)                                                                        |
| install it for good, on a server or with Docker | [Installation](/docs/install/)                                                                         |
| understand what it does during a conversation   | [How the agent works](/docs/agent/), [Memory](/docs/agent/memory/)                                     |
| choose a model, local or hosted                 | [Models](/docs/models/)                                                                                |
| talk to it aloud, or on Telegram                | [Channels and voice](/docs/channels/)                                                                  |
| connect Home Assistant, your mail, MCP servers  | [Home and services](/docs/connections/)                                                                |
| add a speaker or a screen in a room             | [Satellites](/docs/satellites/)                                                                        |
| build your own device                           | the [Python](/docs/sdks/python/), [TypeScript](/docs/sdks/typescript/) or [Rust](/docs/sdks/rust/) SDK |
