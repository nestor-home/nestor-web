---

title: Outils
description: Donner à l’agent la recherche web, les pages web, la météo, les cartes et tout serveur MCP, et aux veilles des flux, des pages et des webhooks.
---

Les outils sont ce que l’agent appelle pendant un tour. Chacun est facultatif.

## Web, météo et cartes

Une ligne chacun dans `tools`. `nestor init` écrit les quatre moteurs gratuits et `web-pages`.

| Outil                         | Plugin                                     | Clé                         | Ce qu’il apporte                                                            |
| ----------------------------- | ------------------------------------------ | --------------------------- | --------------------------------------------------------------------------- |
| Recherche, offre gratuite     | `exa`, `parallel`, `firecrawl`, `keenable` | non (`api_key` facultative) | `web_search`                                                                |
| Recherche, avec clé           | `brave`, `tavily`                          | `api_key`                   | `web_search`                                                                |
| Recherche, hébergée chez vous | `searxng`                                  | non, une `url`              | `web_search`                                                                |
| Pages web                     | `web-pages`                                | non                         | `read_page` : le texte d’une page sans menus ni bandeaux, ou d’un PDF       |
| Météo                         | `open-meteo`                               | non                         | `weather` ; `home` est la ville prise quand aucun lieu n’est demandé        |
| Lieux et trajets              | `openstreetmap`                            | non                         | `find_place` et `route` ; `home` est le départ sauf si un autre est demandé |

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

### Recherche

Tous les moteurs servent un seul `web_search` : ceux à clé d’abord, dans l’ordre, puis les offres
gratuites à tour de rôle, en passant au suivant quand l’un est saturé ou refuse.

Les offres gratuites peuvent être lentes, limitées ou fermées ; l’agent le dit quand une recherche
échoue. Leur `api_key` relève les limites (non essayée avec de vraies clés). `searxng` demande le
format JSON autorisé dans ses réglages.

### Pages, lieux et trajets

- `web-pages` ne lit que des adresses publiques, jamais une de votre réseau, même par un lien.
- `openstreetmap` donne horaires, site et téléphone quand ils sont connus, et des trajets en voiture,
  à vélo ou à pied, sans trafic ni transports en commun. Ses serveurs publics acceptent une recherche
  par seconde ; `nominatim_url` et `routing_url` désignent les vôtres.

## Serveurs MCP

Les serveurs [Model Context Protocol](https://modelcontextprotocol.io) distants se connectent dans
l’admin, sous **Connexions** › **Serveur MCP** : choisissez-en un connu (GitHub, Linear, Notion,
Todoist, Atlassian, Asana, Sentry, Cloudflare, Stripe, Vercel, Canva, Hugging Face) ou tapez une
adresse, puis approuvez l’accès.

Nestor s’enregistre auprès de l’OAuth du serveur (PKCE) : le plus souvent, aucune application à créer.
Les jetons sont chiffrés comme ceux d’un [compte](/fr/docs/accounts/#services).

| Le serveur                                                                | Ce qu’il faut faire                                                                                                                                                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| laisse Nestor s’enregistrer                                               | approuver l’accès                                                                                                                                                                        |
| n’enregistre aucun client (GitHub, Asana)                                 | créer une application OAuth sur le service avec l’adresse de redirection affichée par l’admin, puis taper son identifiant et son secret. GitHub accepte aussi un jeton d’accès personnel |
| ne demande aucune autorisation (Hugging Face, un serveur de votre réseau) | rien : il se connecte aussitôt                                                                                                                                                           |

Une connexion appartient à une personne ou au foyer. Ses outils portent le nom du service
(`linear_list_issues`) ; une écriture (selon les annotations du serveur) demande d’abord l’accord de
la personne, sauf réglage contraire de la connexion, et chaque outil peut être coupé. `@linear` le
désigne à l’agent ([Mentions](/fr/docs/channels/#mentions)).

### Un serveur dans la configuration

Un serveur dans `tools` sert le foyer avec un jeton fixe : pour un serveur de votre réseau, ou pour
fixer le risque de chaque outil.

```yaml
tools:
  - kind: mcp
    name: tracker
    url: http://tracker.lan:8000/mcp
    token: ${TRACKER_TOKEN}
    include: [search_issues, create_issue]
```

| Clé                  | Ce qu’elle fait                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `include`, `exclude` | filtre ses outils                                                                                                               |
| `risks`              | fixe le risque d’un outil : `read`, `write` ou `sensitive`                                                                      |
| `sensitive`          | demande une confirmation quand un argument contient une valeur donnée : `{tool: delete_issue, arguments: {project: [billing]}}` |
| `headers`            | ajoute des en-têtes HTTP, gardés secrets comme le jeton                                                                         |

Sans `risks` ni `sensitive`, aucun outil du serveur ne demande de confirmation.

## Flux, pages et webhooks

Les veilles suivent les sources listées sous `inbound` (et le [courrier](/fr/docs/accounts/#courrier-et-veilles)),
par le nom que vous leur donnez : « préviens-moi quand la lampe passe sous 50 € ». Vous seul ajoutez
une source, pas l’agent.

```yaml
inbound:
  - kind: rss
    feeds:
      - { name: Kernel, url: "https://www.kernel.org/feeds/kdist.xml" }
      - { name: LWN, url: "https://lwn.net/headlines/rss" }
  - kind: web-page
    pages:
      - { name: la lampe, url: "https://shop.example/lampe-fado" }
  - kind: webhook
    hooks:
      - { name: github, kind: github, secret: "${GITHUB_HOOK_SECRET}" }
```

| Source     | Ce qu’elle lit                                  | Fréquence                       | Ce qui est trié                                                                                 |
| ---------- | ----------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `rss`      | des flux RSS et Atom                            | 15 min (`every_s`, au moins 60) | chaque nouvelle entrée, une fois ; le contenu d’un flux à sa première lecture n’est pas nouveau |
| `web-page` | le contenu d’une page, comme le lit `read_page` | 1 h (`every_s`, au moins 300)   | un changement, avec ce qui a changé ; les versions entre deux lectures ne sont pas vues         |
| `webhook`  | du JSON envoyé sur `POST /hooks/<nom>`          | à chaque envoi                  | l’envoi, du `kind` donné au webhook                                                             |

Les flux et pages de votre réseau sont refusés.

Les webhooks écoutent sur 127.0.0.1:8474 (`host`, `port`), derrière un reverse proxy. Un envoi (64 Ko
au plus, `max_bytes`) est signé avec le secret du webhook (`X-Hub-Signature-256: sha256=…`, comme
GitHub) ou le porte (`Authorization: Bearer <secret>`).
