---

title: Home and services
description: Connect Home Assistant for presence and devices, web search, weather and maps, GitHub, Linear, Notion or any MCP server for more tools, accounts (mail, calendars, files, contacts, tasks) for the agent, feeds, pages and webhooks for the watches, and agents for longer tasks.
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

Services that publish a remote [Model Context Protocol](https://modelcontextprotocol.io) server
connect in the admin, under **Connections**, with the **MCP server** connector: pick one of the
known servers (GitHub, Linear, Notion, Todoist, Atlassian, Asana, Sentry, Cloudflare, Stripe,
Vercel, Canva, Hugging Face) or type any server's address, then approve access on the service's
page. Nestor follows the MCP authorization flow: it finds the server's authorization server and
registers itself there, so there is no app to create.

- A server that registers no client (GitHub, Asana) asks for one: create an OAuth app at the
  service with the redirect address the admin shows, then type its ID and secret. GitHub also takes
  a personal access token.
- A server that asks for no authorization (Hugging Face, a server on your network) connects at once.
- A connection belongs to one person, or to the household. Its tools carry the service's name
  (`linear_list_issues`). The server's annotations tell reading from writing, and writing asks the
  person first unless the connection's settings say otherwise. You switch tools off one by one on
  the connection's page.
- In a message, `@linear` points the agent to that server ([Mentions](/docs/channels/#mentions)).

A server written in `tools` serves the whole household with a fixed token. Use it for a server on
your network, or to set the risk of each tool:

```yaml
tools:
  - kind: mcp
    name: tracker
    url: http://tracker.lan:8000/mcp
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

## Connected accounts

Connect accounts in the admin, under **Connections**: pick a service, then the person the account
belongs to, or the whole household. A person’s account serves only them; a household account serves
everyone.

| Service            | Gives the agent                                            | `@` names                                              | Sign-in                     |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------ | --------------------------- |
| Google             | Gmail, Calendar, Drive, Contacts, Tasks                    | `@gmail`, `@calendar`, `@drive`, `@contacts`, `@tasks` | your own OAuth client       |
| Microsoft 365      | Outlook mail and calendar, OneDrive, To Do                 | `@outlook`, `@calendar`, `@onedrive`, `@todo`          | your own app registration   |
| CalDAV and CardDAV | the calendars and contacts of iCloud, Fastmail, Nextcloud… | `@calendar`, `@contacts`                               | a login and an app password |
| IMAP               | any mailbox                                                | `@mail`                                                | a login and an app password |

None of them sends, deletes or changes a mail, a file or a contact. They read, and add events and
tasks after asking (see [Writes](#writes)).

### Google

- **Gmail**: searches and reads mail, with Gmail’s search syntax (`from:`, `newer_than:7d`). New
  mail feeds the [watches](#mail-and-watches).
- **Calendar**: lists the events of the main calendar and adds one.
- **Drive**: searches files and reads one: a Google Doc, Sheet (as CSV) or Slides, a PDF or a text
  file.
- **Contacts**: finds people by name, address, phone or company.
- **Tasks**: lists the open tasks of the default list, adds one and ticks one off.

Google signs in with the household’s own OAuth client, created once in about ten minutes. The admin
shows each step with its links; in short, in the [Google Cloud console](https://console.cloud.google.com/):

1. create a project and enable the Gmail, Google Calendar, Google Drive, People and Google Tasks
   APIs. An API left disabled only takes away its tools;
2. in **Google Auth Platform**, configure the consent screen for an **External** audience and add
   the scopes `openid`, `email`, and, under `https://www.googleapis.com/auth/`, `gmail.readonly`,
   `calendar.events`, `drive.readonly`, `contacts.readonly` and `tasks`;
3. publish the app (**In production**): otherwise Google ends the authorisation after 7 days. The
   app serves only you, so it needs no verification;
4. create a **Web application** client with the redirect URI the admin shows, then paste its ID and
   secret into the admin and click **Connect**. Google warns that it has not verified the app:
   choose **Advanced**, then **Go to Nestor**.

### Microsoft 365

Work, school and personal accounts alike, through Microsoft Graph.

- **Outlook mail**: searches and reads mail (`from:`, `subject:` and `received:` work). New mail
  feeds the [watches](#mail-and-watches).
- **Calendar**: lists the events of the Outlook calendar and adds one.
- **OneDrive**: searches files and reads one: a Word, Excel or PowerPoint document, an OpenDocument
  file, a PDF or a text file.
- **To Do**: lists the open tasks of the default list, adds one and ticks one off.

Microsoft signs in with the household’s own app registration, created once in about ten minutes.
The admin shows each step; in short, in the Azure portal’s
[App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade):

1. register an app for **Accounts in any organizational directory and personal Microsoft
   accounts**, with a **Web** redirect URI: the one the admin shows;
2. in **API permissions**, add these delegated Microsoft Graph permissions: `offline_access`,
   `openid`, `email`, `User.Read`, `Mail.Read`, `MailboxSettings.Read`, `Calendars.ReadWrite`,
   `Files.Read` and `Tasks.ReadWrite`. For a work account, its administrator may have to grant them;
3. in **Certificates & secrets**, create a client secret and copy its **Value**. It expires after
   24 months at most: create the next one before then;
4. paste the **Application (client) ID** and the secret into the admin, then click **Connect**.

### CalDAV and CardDAV

- **Calendars**: lists the events of every calendar and adds one, to the calendar named or the first
  that accepts it.
- **Contacts**: finds people by name, address, phone or company.

Fill in the CalDAV server, the CardDAV server when it is another one, the login and an app password.
Nestor finds the calendars and address books from the server’s address, or from its well-known
address. Addresses are `https://`; plain `http://` works only on the machine Nestor runs on.

- **iCloud**: CalDAV `https://caldav.icloud.com`, CardDAV `https://contacts.icloud.com`, your Apple
  Account address as the login. Create the password at
  [account.apple.com](https://account.apple.com), **Sign-In and Security**, **App-Specific
  Passwords**.
- **Fastmail**: CalDAV `https://caldav.fastmail.com`, CardDAV `https://carddav.fastmail.com`, your
  Fastmail address as the login. Create the password in **Settings**, **Privacy & Security**,
  **Manage app passwords**, with CalDAV and CardDAV access.
- **Nextcloud**: `https://<your Nextcloud>/remote.php/dav` for both, your user name as the login.
  Create the password in **Personal settings**, **Security**, **Create new app password**.

For another server (Synology, Radicale, Baïkal), use the addresses its documentation gives.

### IMAP

Any mailbox, read only: Nestor searches and reads mail, and new mail feeds the
[watches](#mail-and-watches). Use an app password; the admin gives the servers of common providers.
Microsoft no longer accepts passwords over IMAP for personal Outlook accounts: connect them with
Microsoft 365.

### Mentions

In a message, a service’s name points the agent to that account: “add the dentist to `@calendar`”.
When two accounts share a name, the start of the address tells them apart: `@calendar-alex`. See
[Mentions](/docs/channels/#mentions).

### Writes

Tools that write (adding an event, adding a task, ticking one off) ask the person first while the
connection’s **Ask for confirmation before writing** is on, which it is by default (see
[Sensitive actions](/docs/agent/speakers/#sensitive-actions)). On the same page, each tool has its
own switch.

### Settings

`connectors` in `nestor.yaml` lists the services the admin offers; without it, every installed one.
Google and Microsoft 365 take these optional keys:

```yaml
connectors:
  - kind: google
    poll_interval_s: 30 # how often new mail is read for the watches (60 for Microsoft)
    body_chars: 20000 # the longest mail or file read, in characters
    file_bytes: 20000000 # the largest file read
    excerpt_chars: 2000 # the excerpt of each mail the watches sort
  - kind: microsoft
  - kind: dav
  - kind: imap
```

A search returns at most 20 mails or files, 30 contacts, 50 events or 100 tasks.

## Mail and watches

Ask for a **watch**: “tell me when the plumber replies”. A model (`watches.model`) sorts each new
message of the connected Gmail, Outlook and IMAP mailboxes against the open watches and tells the
person who asked, where they are (see [Initiative](/docs/agent/initiative/)).

## Feeds, pages and webhooks

Watches also follow what you list under `inbound`: news feeds, web pages, and posts from your own
services.

```yaml
inbound:
  - kind: rss
    feeds:
      - { name: Kernel, url: "https://www.kernel.org/feeds/kdist.xml" }
      - { name: LWN, url: "https://lwn.net/headlines/rss" }
  - kind: web-page
    pages:
      - { name: the lamp, url: "https://shop.example/fado-lamp" }
  - kind: webhook
    hooks:
      - { name: github, kind: github, secret: "${GITHUB_HOOK_SECRET}" }
```

- `rss` reads RSS and Atom feeds every 15 minutes (`every_s`, at least 60). Each new entry is
  sorted once; what a feed holds at its first read is not new.
- `web-page` reads each page every hour (`every_s`, at least 300), like `read_page`: its content
  without menus and banners. A change is sorted with what changed, and the model judges whether it
  is the one awaited (“under 50 €”). Versions between two reads are not seen.
- `webhook` takes JSON at `POST /hooks/<name>`, on port 8474 of 127.0.0.1 (`host`, `port`: put a
  reverse proxy in front). A post is signed with its hook’s secret (`X-Hub-Signature-256:
  sha256=…`, as GitHub signs) or bears it (`Authorization: Bearer <secret>`), up to 64 KB
  (`max_bytes`). Its posts are of the hook’s `kind`.

Feeds and pages on your own network are refused. The agent knows them by the names you give: “tell
me when Linux 7 is out on Kernel”, “tell me when the lamp drops under 50 €”. A new feed or page is
added here, not by the agent.

## Longer tasks

Tasks that take minutes go to an **executor**, an agent that works in the background. Nestor tracks
the task, tells the person when it is done, and sends the files the executor made with the result,
where the channel can carry them. `description` tells the agent what to hand over: write what this
executor can really do. Each executor is named after its `kind`; give two of the same kind a `name`.

### Hermes

```yaml
executors:
  - kind: hermes
    base_url: https://hermes.example/v1
    api_key: ${HERMES_API_KEY}
    model: research
    description: Searches the web and writes a short report. No access to the house.
```

`model` is the Hermes agent profile. Its runs live on the Hermes server: a task goes on through a
restart of Nestor.

### Codex

Nestor drives [Codex](https://github.com/openai/codex) through `codex app-server`. Install the Codex
CLI where it will run and sign in (`codex login`).

```yaml
executors:
  - kind: codex
    working_directory: /srv/codex/work
    sandbox: workspace-write
    description: Writes and runs code in /srv/codex/work. No access to the house.
```

Each task is a Codex thread in `working_directory`. Codex never waits for an approval: `sandbox`
decides what it may change (`read-only`, `workspace-write` by default, or `danger-full-access`), and
a request for approval or input is declined. `model` picks its model; `config` passes Codex settings
to each task, as in its `config.toml` (MCP servers, network access in the sandbox).

To run Codex on a server, start its daemon there (`codex app-server daemon start`) and let `command`
reach it:

```yaml
executors:
  - kind: codex
    command: [ssh, codex@server, codex, app-server, proxy]
    working_directory: /srv/codex/work
    description: Writes and runs code on the server, in /srv/codex/work. No access to the house.
```

A task then goes on through a restart of Nestor, which finds its thread again. A `codex app-server`
started by Nestor stops with it, and its task is reported interrupted.

### Claude Code

Nestor runs [Claude Code](https://github.com/anthropics/claude-code) headless (`claude -p`) on its
own machine. Install it and sign in, or give an API key.

```yaml
executors:
  - kind: claude-code
    working_directory: /home/nestor/work
    allowed_tools: [Read, Glob, Grep, Write, Edit, "Bash(git *)"]
    max_budget_usd: 2
    api_key: ${ANTHROPIC_API_KEY}
    description: Writes and fixes code in /home/nestor/work and commits with git. No access to the house.
```

Nobody answers a permission prompt in a headless run. With `permission_mode: dontAsk`, the default,
only `allowed_tools` run; without the setting, they read and write in its folder and search the web,
with no shell. `max_budget_usd` caps what one task spends, `model` picks the model. A task runs in a
process of Nestor: a restart reports it interrupted. Its session id is the task's first step in the
journal, to open it again with `claude --resume`.

Codex and Claude Code hand back files from `working_directory` only, at most 10 per task and
`max_file_bytes` each (20 MB by default); the result says which were left out.
