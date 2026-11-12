---

title: Introduction
description: What Nestor does for a household, what it is made of, and where to start.
---

Nestor is an open-source assistant for the whole household. It runs on a machine at home, and
everyone talks to it: aloud in the kitchen, in writing at the office, on Telegram when away. The
project is young: expect changes between releases.

## What it does for you

- **It knows who is asking**, and keeps each person’s conversations and memories.
- **It remembers** what you told it, with dates, and recalls what matters at each turn.
- **It drives the house** through Home Assistant, and knows who is home.
- **It keeps watch** on your mail for a parcel or a reply.
- **It speaks to the right person**, where they are, and keeps quiet during the hours you set.
- **It keeps a journal** of everything it does and why, shown in the admin.

## What it is made of

- **The server**, the Python package `nestor-home`: the agent, its memory, its journal and the
  admin.
- **A language model**, hosted or local.
- **Channels**: the admin’s chat, messaging apps such as Telegram, and **satellites** you type on or
  talk to (a speaker, a wall tablet, a Reachy Mini robot).
- **Integrations**: Home Assistant, MCP servers, mail, agents for longer tasks.

## Where to start

| You want to…                                    | Read                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| try Nestor on your computer in ten minutes      | [Quickstart](/docs/quickstart/)                                                                        |
| install it for good, on a server or with Docker | [Installation](/docs/install/)                                                                         |
| know what it does during a conversation         | [How the agent works](/docs/agent/), [Memory](/docs/agent/memory/)                                     |
| choose a model, local or hosted                 | [Models](/docs/models/)                                                                                |
| talk to it aloud, or from a messaging app       | [Channels and voice](/docs/channels/)                                                                  |
| connect Home Assistant, your mail, MCP servers  | [Home and services](/docs/connections/)                                                                |
| add a speaker or a screen in a room             | [Satellites](/docs/satellites/)                                                                        |
| build your own device                           | the [Python](/docs/sdks/python/), [TypeScript](/docs/sdks/typescript/) or [Rust](/docs/sdks/rust/) SDK |
