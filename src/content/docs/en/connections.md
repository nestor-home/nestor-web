---

title: Home and services
description: Connect Home Assistant for presence and devices, any MCP server for more tools, mailboxes for the watches, and agents for longer tasks.
---

Nestor sees and acts through what you connect here. Each connection is optional.

## Home Assistant

Home Assistant gives Nestor **presence** (who is home, and in which room when it knows) and
**devices** (what it exposes to assistants, through its MCP server).

In Home Assistant:

1. create a long-lived access token (your profile, **Security**);
2. for devices, add the **Model Context Protocol Server** integration and pick the entities in
   **Settings › Voice assistants › Expose**.

In `.env`:

```ini
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_MCP_URL=http://homeassistant.local:8123/api/mcp
HOME_ASSISTANT_TOKEN=eyJ...
```

In `nestor.yaml` (`nestor init` wrote it, commented out):

```yaml
presence:
  kind: home-assistant
  url: ${HOME_ASSISTANT_URL}
  token: ${HOME_ASSISTANT_TOKEN}
  people:
    alex: person.alex # each household id, with its person entity

tools:
  - kind: mcp
    name: home
    url: ${HOME_ASSISTANT_MCP_URL}
    token: ${HOME_ASSISTANT_TOKEN}
```

`presence` also takes `rooms`, a sensor per person that gives their room (Bermuda, ESPresense).

## MCP servers

Each [Model Context Protocol](https://modelcontextprotocol.io) server in `tools` adds its tools to
the agent:

```yaml
tools:
  - kind: mcp
    name: tracker
    url: https://mcp.example.com/mcp
    token: ${TRACKER_TOKEN}
    include: [search_issues, create_issue]
```

- `include` or `exclude` filters its tools.
- `risks` overrides a tool’s risk: `read`, `write` or `sensitive`.
- `headers` adds HTTP headers, kept secret like the token.

## Mail and watches

Connect mailboxes in the admin, under **Connections**, read only: Gmail, through your own Google
OAuth application (the admin walks you through it), or any IMAP mailbox with an application password.

Then ask for a **watch**: “tell me when the plumber replies”. A model (`watches.model`) sorts each
new message against the open watches and tells the person who asked, where they are. During quiet
hours it writes, unless it is urgent.

## Longer tasks

Tasks that take minutes go to an **executor**, an agent that works in the background. Nestor tracks
the task and tells the person when it is done. Hermes is available today:

```yaml
executors:
  - kind: hermes
    base_url: https://hermes.example/v1
    api_key: ${HERMES_API_KEY}
    model: research
    description: Searches the web and writes a short report. No access to the house.
```

`model` is the Hermes agent profile. `description` tells the agent what to hand it.
