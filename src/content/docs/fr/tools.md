---

title: Outils
description: Donner à l’agent la recherche web, les pages web, la météo, les cartes et tout serveur MCP, et aux veilles des flux, des pages et des webhooks.
---

Les outils sont ce que l’agent appelle pendant un tour : une recherche, une page, la météo, un trajet,
le serveur MCP d’un service. Chacun est facultatif.

## Web, météo et cartes

Chacun de ces outils est une ligne de `tools`. `nestor init` écrit les quatre moteurs gratuits et
`web-pages`.

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

Tous les moteurs de `tools` servent l’unique `web_search` de l’agent. Ceux qui ont une clé passent
d’abord, dans l’ordre de la configuration, puis les offres gratuites à tour de rôle. Une recherche
passe au moteur suivant quand l’un est saturé ou la refuse.

Les offres gratuites sont parfois lentes, limitées ou fermées. L’agent sait quand il ne cherche que
par elles, et le dit quand une recherche échoue. Leur `api_key` relève les limites (pas encore essayée
avec de vraies clés). `searxng` est un moteur que vous hébergez, à son `url`, avec le format JSON
autorisé dans ses réglages.

### Pages, lieux et trajets

- `web-pages` ne lit que des adresses publiques : l’agent ne lit jamais une adresse de votre réseau,
  même par un lien.
- `openstreetmap` donne les horaires d’ouverture, le site et le téléphone d’un lieu quand
  OpenStreetMap les connaît, et des trajets en voiture, à vélo ou à pied, sans trafic ni transports en
  commun. Il passe par les serveurs publics de la communauté OpenStreetMap, qui acceptent une
  recherche par seconde ; `nominatim_url` et `routing_url` désignent les vôtres.

## Serveurs MCP

Les services qui publient un serveur [Model Context Protocol](https://modelcontextprotocol.io) distant
se connectent dans l’admin, sous **Connexions**, avec le connecteur **Serveur MCP**. Choisissez un
serveur connu (GitHub, Linear, Notion, Todoist, Atlassian, Asana, Sentry, Cloudflare, Stripe, Vercel,
Canva, Hugging Face) ou tapez l’adresse de n’importe quel serveur, puis approuvez l’accès sur la page
du service.

Nestor suit le parcours d’autorisation de MCP, par OAuth avec PKCE : il trouve le serveur
d’autorisation du serveur et s’y enregistre, sans application à créer. Les jetons sont gardés
chiffrés, comme ceux d’un [compte](/fr/docs/accounts/#services).

| Le serveur                                                                | Ce qu’il faut faire                                                                                                                                                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| laisse Nestor s’enregistrer                                               | approuver l’accès                                                                                                                                                                        |
| n’enregistre aucun client (GitHub, Asana)                                 | créer une application OAuth sur le service avec l’adresse de redirection affichée par l’admin, puis taper son identifiant et son secret. GitHub accepte aussi un jeton d’accès personnel |
| ne demande aucune autorisation (Hugging Face, un serveur de votre réseau) | rien : il se connecte aussitôt                                                                                                                                                           |

Une connexion appartient à une personne ou au foyer. Ses outils portent le nom du service
(`linear_list_issues`). Les annotations du serveur disent s’ils lisent ou écrivent, et une écriture
demande d’abord l’accord de la personne, sauf si les réglages de la connexion disent autrement. Vous
coupez les outils un par un sur la page de la connexion. Dans un message, `@linear` désigne ce serveur
à l’agent ([Mentions](/fr/docs/channels/#mentions)).

### Un serveur dans la configuration

Un serveur écrit dans `tools` sert tout le foyer avec un jeton fixe. Utilisez-le pour un serveur de
votre réseau, ou pour fixer le risque de chaque outil :

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

Les veilles suivent ce que vous listez sous `inbound`, en plus du [courrier](/fr/docs/accounts/#courrier-et-veilles).
L’agent connaît chaque source par le nom que vous lui donnez : « préviens-moi quand Linux 7 sort sur
Kernel », « quand la lampe passe sous 50 € ». Un nouveau flux ou une nouvelle page s’ajoute ici, pas
par l’agent.

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

Les flux et les pages de votre propre réseau sont refusés. Pour une page, le modèle juge si un
changement est celui qu’on attend (« sous 50 € »).

Un webhook écoute sur le port 8474 de 127.0.0.1 (`host`, `port`) : mettez un reverse proxy devant. Un
envoi est signé avec le secret de son webhook (`X-Hub-Signature-256: sha256=…`, comme GitHub signe) ou
le porte (`Authorization: Bearer <secret>`), jusqu’à 64 Ko (`max_bytes`).
