---

title: Quickstart
description: From nothing to a first conversation with Nestor on your computer, in writing, in about ten minutes.
---

You need macOS or Linux with [uv](https://docs.astral.sh/uv/getting-started/installation/) and a
model key ([OpenRouter](https://openrouter.ai/keys) by default, or [any OpenAI-compatible
server](/docs/models/)). Other ways: [Installation](/docs/install/).

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

Answer the questions (Enter keeps the default) and choose an admin password of 10+ characters. It
writes `nestor.yaml`, `.env` (keys) and `state/` (database), never overwriting.

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

`nestor check` names what is missing. Leave `nestor run` running.

</li>
<li>

**Write to it** in the admin

Open [http://localhost:8470](http://localhost:8470), sign in, open **Talk** and write.

</li>
</ol>
</div>

## Talk to it from a terminal

In a second terminal, same folder, create a pairing code:

```bash
nestor satellites add --room office --name Terminal
```

Pass the printed URI to the satellite:

```bash
uvx nestor-satellite run --room office --text --no-voice --pairing-uri 'nestor+http://…'
```

Type a message and press Enter. Later runs reconnect without a code.

## Next

- [Channels](/docs/channels/) and [Voice](/docs/voice/)
- [Home Assistant](/docs/home/)
- [How the agent works](/docs/agent/)
