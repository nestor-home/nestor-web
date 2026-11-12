---

title: Home and services
description: Connect Home Assistant for presence and devices, web search, weather and maps, any MCP server for more tools, mailboxes for the watches, and agents for longer tasks.
---

Nestor sees and acts through what you connect here. Each connection is optional.

## Home Assistant

Home Assistant gives Nestor **presence** (who is home, and in which room when it knows) and
**devices** (what it exposes to assistants, through its MCP server), with one address and one token.

In Home Assistant:

1. create a long-lived access token (your profile, **Security**);
2. for devices, add the **Model Context Protocol Server** integration and pick the entities in
   **Settings › Voice assistants › Expose**.

In `.env`:

```ini
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_TOKEN=eyJ...
```

In `nestor.yaml` (`nestor init` wrote it, commented out):

```yaml
home:
  kind: home-assistant
  url: ${HOME_ASSISTANT_URL}
  token: ${HOME_ASSISTANT_TOKEN}
  people:
    alex: person.alex # each household id, with its person entity
```

`home` also takes `rooms`, a sensor per person that gives their room (Bermuda, ESPresense),
`occupancy_sensors`, the sensors that say a room is occupied (by default every occupancy, presence
or motion sensor with an area), and `sensitive`, what needs a person's go-ahead (see
[Speakers](/docs/agent/speakers/)). The
admin's **Home** page shows who is where, the rooms, the people Home Assistant knows and its actions.

## Web, weather and maps

Each of these tools is one line in `tools`, and each is optional.

```yaml
tools:
  - kind: searxng # or brave, or tavily: one search engine
    url: http://searxng:8080
  - kind: web-pages
  - kind: open-meteo
    home: Lyon
  - kind: openstreetmap
    home: 12 rue Mercière, Lyon
```

- **Search**: `searxng` is a search engine you host, without a key; its settings must allow the
  JSON format. `brave` and `tavily` take an `api_key`.
- **Pages**: `web-pages` reads a page from its address: its text without menus or banners, or a
  PDF's. Only public addresses: the agent never reads one on your network, even through a link.
- **Weather**: `open-meteo`, without a key. `home` is the town used when no place is asked.
- **Places and journeys**: `openstreetmap` finds places and computes journeys by car, bike or on
  foot, from `home` unless another start is asked, without traffic or public transport. It uses
  the OpenStreetMap community's public servers, which accept one search a second; `nominatim_url`
  and `routing_url` point to your own.

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
- `risks` sets a tool’s risk: `read`, `write` or `sensitive`. The server’s annotations only tell
  reading from writing.
- `sensitive` asks for a confirmation when an argument holds one of the given values:
  `{tool: delete_issue, arguments: {project: [billing]}}`. Without `risks` or `sensitive`, no tool
  of the server asks for one.
- `headers` adds HTTP headers, kept secret like the token.

## Mail and watches

Connect mailboxes in the admin, under **Connections**, read only: Gmail, through your own Google
OAuth application (the admin walks you through it), or any IMAP mailbox with an application
password. The agent can then search and read that mail, for its owner only. In a message, `@gmail`
or `@mail` points it to that mailbox ([Mentions](/docs/channels/#mentions)).

Then ask for a **watch**: “tell me when the plumber replies”. A model (`watches.model`) sorts each
new message against the open watches and tells the person who asked, where they are (see
[Initiative](/docs/agent/initiative/)).

## Longer tasks

Tasks that take minutes go to an **executor**, an agent that works in the background. Nestor tracks
the task and tells the person when it is done. Nestor comes with a Hermes executor:

```yaml
executors:
  - kind: hermes
    base_url: https://hermes.example/v1
    api_key: ${HERMES_API_KEY}
    model: research
    description: Searches the web and writes a short report. No access to the house.
```

`model` is the Hermes agent profile. `description` tells the agent what to hand it.
