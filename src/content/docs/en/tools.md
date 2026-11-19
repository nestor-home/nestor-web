---

title: Tools
description: Give the agent web search, web pages, weather, maps and any MCP server, and give the watches feeds, pages and webhooks.
---

Tools are what the agent calls during a turn. Each is optional.

## Web, weather and maps

One line each in `tools`. `nestor init` writes the four free search engines and `web-pages`.

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

All engines serve one `web_search`: those with a key first, in order, then the free tiers in turn,
moving on when one is busy or refuses.

Free tiers can be slow, limited or closed; the agent says so when a search fails. Their `api_key`
raises the limits (untested with real keys). `searxng` needs the JSON format allowed in its settings.

### Pages, places and journeys

- `web-pages` reads public addresses only, never one on your network, even through a link.
- `openstreetmap` gives opening hours, website and phone when known, and journeys by car, bike or on
  foot, without traffic or public transport. Its public servers accept one search a second;
  `nominatim_url` and `routing_url` point to your own.

## MCP servers

Remote [Model Context Protocol](https://modelcontextprotocol.io) servers connect in the admin, under
**Connections** › **MCP server**: pick a known one (GitHub, Linear, Notion, Todoist, Atlassian, Asana,
Sentry, Cloudflare, Stripe, Vercel, Canva, Hugging Face) or type an address, then approve access.

Nestor registers itself with the server's OAuth (PKCE), so there is usually no app to create. Tokens
are encrypted like an [account's](/docs/accounts/#services).

| The server                                                         | What to do                                                                                                                                           |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| lets Nestor register                                               | approve access                                                                                                                                       |
| registers no client (GitHub, Asana)                                | create an OAuth app at the service with the redirect address the admin shows, then type its ID and secret. GitHub also takes a personal access token |
| asks for no authorization (Hugging Face, a server on your network) | nothing: it connects at once                                                                                                                         |

A connection belongs to one person or the household. Tools carry the service's name
(`linear_list_issues`); a write (per the server's annotations) asks the person first unless the
connection's settings say otherwise, and each tool can be switched off. `@linear` points the agent to
it ([Mentions](/docs/channels/#mentions)).

### A server in the configuration

A server in `tools` serves the household with a fixed token: for a server on your network, or to
set each tool's risk.

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

Watches follow the sources under `inbound` (and [mail](/docs/accounts/#mail-and-watches)), by the
name you give them: "tell me when the lamp drops under 50 €". Only you add a source, not the agent.

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

Feeds and pages on your network are refused.

Webhooks listen on 127.0.0.1:8474 (`host`, `port`), behind a reverse proxy. A post (64 KB max,
`max_bytes`) is signed with the hook's secret (`X-Hub-Signature-256: sha256=…`, like GitHub) or bears
it (`Authorization: Bearer <secret>`).
