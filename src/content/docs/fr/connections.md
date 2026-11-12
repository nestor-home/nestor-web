---

title: Maison et services
description: Brancher Home Assistant pour la présence et les appareils, la recherche web, la météo et les cartes, des serveurs MCP pour d’autres outils, des boîtes mail pour les veilles, et des agents pour les tâches longues.
---

Nestor voit et agit par ce que vous branchez ici. Chaque branchement est facultatif.

## Home Assistant

Home Assistant apporte à Nestor **la présence** (qui est là, et dans quelle pièce quand il le sait)
et **les appareils** (ce qu’il expose aux assistants, par son serveur MCP), avec une adresse et un
jeton.

Dans Home Assistant :

1. créez un jeton d’accès longue durée (votre profil, **Sécurité**) ;
2. pour les appareils, ajoutez l’intégration **Model Context Protocol Server** et choisissez les
   entités dans **Paramètres › Assistants vocaux › Exposer**.

Dans `.env` :

```ini
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_TOKEN=eyJ...
```

Dans `nestor.yaml` (`nestor init` l’a écrit, en commentaire) :

```yaml
home:
  kind: home-assistant
  url: ${HOME_ASSISTANT_URL}
  token: ${HOME_ASSISTANT_TOKEN}
  people:
    alex: person.alex # chaque identifiant du foyer, avec son entité personne
```

`home` accepte aussi `rooms`, un capteur par personne qui donne sa pièce (Bermuda, ESPresense),
`occupancy_sensors`, les capteurs qui disent qu’une pièce est occupée (par défaut tout capteur
d’occupation, de présence ou de mouvement rattaché à une pièce), et `sensitive`, ce qui demande
l’accord d’une personne (voir [Locuteurs](/fr/docs/agent/speakers/)). La
page **Maison** de l’admin montre qui est où, les pièces, les personnes que Home Assistant connaît et
ses actions.

## Web, météo et cartes

Chacun de ces outils est une ligne de `tools`, et chacun est facultatif.

```yaml
tools:
  - kind: searxng # ou brave, ou tavily : un seul moteur de recherche
    url: http://searxng:8080
  - kind: web-pages
  - kind: open-meteo
    home: Lyon
  - kind: openstreetmap
    home: 12 rue Mercière, Lyon
```

- **Recherche** : `searxng` est un moteur que vous hébergez, sans clé ; ses réglages doivent
  autoriser le format JSON. `brave` et `tavily` prennent une `api_key`.
- **Pages** : `web-pages` lit une page à partir de son adresse : son texte sans menus ni bandeaux,
  ou celui d’un PDF. Seulement les adresses publiques : l’agent ne lit jamais une adresse de votre
  réseau, même par un lien.
- **Météo** : `open-meteo`, sans clé. `home` est la ville prise quand aucun lieu n’est demandé.
- **Lieux et trajets** : `openstreetmap` trouve des lieux et calcule des trajets en voiture, à vélo
  ou à pied, depuis `home` sauf si un autre départ est demandé, sans trafic ni transports en commun.
  Il passe par les serveurs publics de la communauté OpenStreetMap, qui acceptent une recherche par
  seconde ; `nominatim_url` et `routing_url` désignent les vôtres.

## Serveurs MCP

Chaque serveur [Model Context Protocol](https://modelcontextprotocol.io) de `tools` ajoute ses
outils à l’agent :

```yaml
tools:
  - kind: mcp
    name: tracker
    url: https://mcp.example.com/mcp
    token: ${TRACKER_TOKEN}
    include: [search_issues, create_issue]
```

- `include` ou `exclude` filtre ses outils.
- `risks` fixe le risque d’un outil : `read`, `write` ou `sensitive`. Les annotations du serveur
  disent seulement s’il lit ou s’il écrit.
- `sensitive` demande une confirmation quand un argument contient l’une des valeurs données :
  `{tool: delete_issue, arguments: {project: [billing]}}`. Sans `risks` ni `sensitive`, aucun outil
  du serveur n’en demande.
- `headers` ajoute des en-têtes HTTP, gardés secrets comme le jeton.

## Courrier et veilles

Branchez les boîtes mail dans l’administration, sous **Connexions**, en lecture seule : Gmail, par
votre propre application OAuth Google (l’administration vous guide), ou toute boîte IMAP avec un mot
de passe d’application. L’agent peut alors y chercher et lire le courrier, seulement pour la
personne à qui la boîte appartient. Dans un message, `@gmail` ou `@mail` la lui désigne
([Mentions](/fr/docs/channels/#mentions)).

Demandez ensuite une **veille** : « préviens-moi quand le plombier répond ». Un modèle
(`watches.model`) trie chaque nouveau message face aux veilles ouvertes et prévient la personne qui
l’a demandée, là où elle est (voir [Initiative](/fr/docs/agent/initiative/)).

## Tâches longues

Ce qui prend des minutes va à un **exécutant**, un agent qui travaille en arrière-plan. Nestor suit
la tâche et prévient la personne quand elle est faite. Nestor fournit un exécutant Hermes :

```yaml
executors:
  - kind: hermes
    base_url: https://hermes.example/v1
    api_key: ${HERMES_API_KEY}
    model: research
    description: Searches the web and writes a short report. No access to the house.
```

`model` est le profil d’agent de Hermes. `description` dit à l’agent quoi lui confier.
