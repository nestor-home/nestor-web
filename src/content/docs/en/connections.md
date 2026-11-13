---

title: Home and services
description: Connect Home Assistant for presence and devices, web search, weather and maps, any MCP server for more tools, accounts (mail, calendars, files, contacts, tasks) for the agent and the watches, and agents for longer tasks.
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
