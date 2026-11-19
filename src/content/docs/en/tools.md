---

title: Tools
description: Give the agent web search, web pages, weather, maps and any MCP server, and give the watches feeds, pages and webhooks.
---

Tools are what the agent calls during a turn: a search, a page, the weather, a route, a service's
MCP server. Each is optional.

## Web, weather and maps

Each of these tools is one line in `tools`. `nestor init` writes the four free search engines and
`web-pages`.

| Tool                | Plugin                                     | Key needed              | What it gives                                                         |
| ------------------- | ------------------------------------------ | ----------------------- | --------------------------------------------------------------------- |
| Search, free tiers  | `exa`, `parallel`, `firecrawl`, `keenable` | no (`api_key` optional) | `web_search`                                                          |
| Search, with a key  | `brave`, `tavily`                          | `api_key`               | `web_search`                                                          |
| Search, self-hosted | `searxng`                                  | no, a `url`             | `web_search`                                                          |
| Web pages           | `web-pages`                                | no                      | `read_page`: a page's text without menus or banners, or a PDF's       |
| Weather             | `open-meteo`                               | no                      | `weather`; `home` is the town used when no place is asked             |
| Places and journeys | `openstreetmap`                            | no                      | `find_place` and `route`; `home` is the start unless another is asked |

```yaml
tools:
  - kind: exa
  - kind: keenable
  - kind: web-pages
  - kind: open-meteo
    home: Lyon
  - kind: openstreetmap
    home: 12 rue Mercière, Lyon
```

### Search

Every engine in `tools` serves the agent's one `web_search`. Engines with a key come first, in the
configuration's order, then the free tiers in turn. A search moves to the next engine when one is
busy or refuses it.

Free tiers may be slow, limited or closed at times. The agent knows when it searches on them only,
and says so when a search fails. Their `api_key` raises the limits (not yet tried with real keys).
`searxng` is an engine you host, at its `url`, with the JSON format allowed in its settings.

### Pages, places and journeys

- `web-pages` reads public addresses only: the agent never reads one on your network, even through a
  link.
- `openstreetmap` gives a place's opening hours, website and phone when OpenStreetMap knows them, and
  journeys by car, bike or on foot, without traffic or public transport. It uses the OpenStreetMap
  community's public servers, which accept one search a second; `nominatim_url` and `routing_url`
  point to your own.

## MCP servers

Services that publish a remote [Model Context Protocol](https://modelcontextprotocol.io) server
connect in the admin, under **Connections**, with the **MCP server** connector. Pick a known server
(GitHub, Linear, Notion, Todoist, Atlassian, Asana, Sentry, Cloudflare, Stripe, Vercel, Canva,
Hugging Face) or type any server's address, then approve access on the service's page.

Nestor follows the MCP authorization flow, with OAuth and PKCE: it finds the server's authorization
server and registers itself there, so there is no app to create. The tokens
are kept encrypted, like an [account's](/docs/accounts/#services).

| The server                                                         | What to do                                                                                                                                           |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| lets Nestor register                                               | approve access                                                                                                                                       |
| registers no client (GitHub, Asana)                                | create an OAuth app at the service with the redirect address the admin shows, then type its ID and secret. GitHub also takes a personal access token |
| asks for no authorization (Hugging Face, a server on your network) | nothing: it connects at once                                                                                                                         |

A connection belongs to one person or to the household. Its tools carry the service's name
(`linear_list_issues`). The server's annotations tell reading from writing, and a write asks the
person first unless the connection's settings say otherwise. You switch tools off one by one on the
connection's page. In a message, `@linear` points the agent to that server
([Mentions](/docs/channels/#mentions)).

### A server in the configuration

A server written in `tools` serves the whole household with a fixed token. Use it for a server on your
network, or to set the risk of each tool:

```yaml
tools:
  - kind: mcp
    name: tracker
    url: http://tracker.lan:8000/mcp
    token: ${TRACKER_TOKEN}
    include: [search_issues, create_issue]
```

| Key                  | What it does                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `include`, `exclude` | filters its tools                                                                                                     |
| `risks`              | sets a tool's risk: `read`, `write` or `sensitive`                                                                    |
| `sensitive`          | asks for a confirmation when an argument holds a given value: `{tool: delete_issue, arguments: {project: [billing]}}` |
| `headers`            | adds HTTP headers, kept secret like the token                                                                         |

Without `risks` or `sensitive`, no tool of the server asks for a confirmation.

## Feeds, pages and webhooks

Watches follow what you list under `inbound`, as well as [mail](/docs/accounts/#mail-and-watches).
The agent knows each source by the name you give it: "tell me when Linux 7 is out on Kernel", "tell me
when the lamp drops under 50 €". A new feed or page is added here, not by the agent.

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

| Source     | Reads                                     | Every                           | What is sorted                                                       |
| ---------- | ----------------------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `rss`      | RSS and Atom feeds                        | 15 min (`every_s`, at least 60) | each new entry, once; what a feed holds at its first read is not new |
| `web-page` | a page's content, as `read_page` reads it | 1 h (`every_s`, at least 300)   | a change, with what changed; versions between two reads are not seen |
| `webhook`  | JSON posted to `POST /hooks/<name>`       | on each post                    | the post, of the hook's `kind`                                       |

Feeds and pages on your own network are refused. For a page, the model judges whether a change is the
one awaited ("under 50 €").

A webhook listens on port 8474 of 127.0.0.1 (`host`, `port`): put a reverse proxy in front. A post is
signed with its hook's secret (`X-Hub-Signature-256: sha256=…`, as GitHub signs) or bears it
(`Authorization: Bearer <secret>`), up to 64 KB (`max_bytes`).
