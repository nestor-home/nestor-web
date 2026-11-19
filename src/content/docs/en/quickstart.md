---

title: Quickstart
description: From nothing to a first conversation with Nestor on your computer, in writing, in about ten minutes.
---

The shortest way to a first answer: uv, a hosted model, text only. Other ways are in
[Installation](/docs/install/).

You need macOS or Linux with [uv](https://docs.astral.sh/uv/getting-started/installation/), and a
model provider key: [OpenRouter](https://openrouter.ai/keys) by default, or any OpenAI-compatible
server, local ones included ([Models](/docs/models/)).

## Run the server

<div class="doc-steps">
<ol>
<li>

**Install Nestor**

```bash quickstart
uv tool install nestor-home
```

</li>
<li>

**Write a first configuration**

```bash quickstart
mkdir nestor && cd nestor
nestor init
```

It asks for names, the language, the time zone, the model and the channels (Enter keeps each
default), then creates your admin login, with a password of 10 characters or more. It writes
`nestor.yaml` (the configuration), `.env` (the keys) and `state/` (the database), and never
overwrites an existing one.

</li>
<li>

**Add the model key** to `MODEL_API_KEY` in `.env`

```ini
MODEL_API_KEY=sk-or-...
```

</li>
<li>

**Check and start**

```bash quickstart
nestor check
nestor run
```

`nestor check` names what is missing, such as an empty key. Leave `nestor run` running.

</li>
<li>

**Write to it** in the admin

Open [http://localhost:8470](http://localhost:8470), sign in with the login from step 2, open
**Talk** and write a message. Nestor answers in the page.

</li>
</ol>
</div>

## Talk to it from a terminal

A terminal can act as a satellite. In a second terminal, in the same folder, create a pairing code:

```bash
nestor satellites add --room office --name Terminal
```

Pass the URI it prints (`nestor+http://…:8471/?code=…`) to the satellite:

```bash
uvx nestor-satellite run --room office --text --no-voice --pairing-uri 'nestor+http://…'
```

Type a message and press Enter. The answer prints in the terminal and the turn shows in the admin's
journal. Later runs reconnect without a code.

## Next

- Reach it from a messaging app: [Channels](/docs/channels/). Talk to it aloud: [Voice](/docs/voice/).
- Let it see who is home and run the house: [Home Assistant](/docs/home/).
- What happened during that turn: [How the agent works](/docs/agent/).
