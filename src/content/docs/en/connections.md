---

title: Home and services
description: Connect Home Assistant for presence and devices, any MCP server for more tools, mailboxes for the watches, and agents for longer tasks.
---

On its own, Nestor talks and remembers. What it can see and do comes from what you connect:
Home Assistant for the house, MCP servers for other tools, mailboxes for the watches, and other
agents for tasks that take longer than a conversation. Each is optional.

## Home Assistant

Home Assistant gives Nestor two things, set separately:

- **presence**: who is home, and in which room when Home Assistant knows. Nestor uses it to choose
  where to speak and whom it is talking to;
- **devices**: lights, covers, climate, sensors, through Home Assistant’s own MCP server. Nestor can
  then read and change what Home Assistant exposes to assistants.

First, in Home Assistant:

1. create a long-lived access token (your profile, **Security**);
2. for devices, add the **Model Context Protocol Server** integration, and choose in **Settings ›
   Voice assistants › Expose** which entities assistants may see.

Then put the address and the token in `.env`:

```ini
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_MCP_URL=http://homeassistant.local:8123/api/mcp
HOME_ASSISTANT_TOKEN=eyJ...
```

and add, in `nestor.yaml` (`nestor init` wrote these lines, commented out):

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

`presence` also takes `rooms`, a sensor per person that tells their room (Bermuda, ESPresense), and
`occupancy_sensors`, which overrides the motion and presence sensors found in Home Assistant’s
areas. Nestor follows presence over Home Assistant’s WebSocket API and reconnects on its own.

## MCP servers

Any server that speaks the [Model Context Protocol](https://modelcontextprotocol.io) adds its tools
to the agent. Each is an entry of `tools`:

```yaml
tools:
  - kind: mcp
    name: tracker
    url: https://mcp.example.com/mcp
    token: ${TRACKER_TOKEN}
    include: [search_issues, create_issue]
```

- `include` and `exclude` choose which of the server’s tools the agent sees; all by default.
- `risks` sets a tool’s risk by name (`read`, `write` or `sensitive`), over what the server
  declares.
- `headers` adds HTTP headers, kept secret like the token; `timeout_s` (10) bounds each call.

## Mail and watches

Mailboxes are connected from the admin, not in the file: open **Connections**.

- **Gmail**, read only. Each household declares its own Google OAuth application: the admin shows
  the redirect URI to register with Google, then asks for its client ID and secret, once. After
  that, connecting an account is a sign-in with Google.
- **Any IMAP mailbox**, read only, with its server and an application password.

Once a mailbox is connected, the agent can search and read it, and you can ask for a **watch**:
“tell me when the plumber replies”, “watch for the parcel from Lyon”. Each new message is sorted
against the open watches by a model (`watches.model`, the written one by default). A match is
announced to the person who asked, where they are; during quiet hours it is written rather than
spoken, unless it is urgent.

## Longer tasks

The agent stays fast: what takes minutes is handed to an **executor**, another agent that works in
the background and reports back. Nestor follows the task in its journal and tells the person when it
is done. Hermes is the executor available today:

```yaml
executors:
  - kind: hermes
    base_url: https://hermes.example/v1
    api_key: ${HERMES_API_KEY}
    model: research
    description: Searches the web and writes a short report. No access to the house.
```

`model` is the Hermes agent profile. `description` tells the agent what this executor can really
do, so it hands it only what fits.
