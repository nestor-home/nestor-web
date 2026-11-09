---

title: Maison et services
description: Brancher Home Assistant pour la présence et les appareils, des serveurs MCP pour d’autres outils, des boîtes mail pour les veilles, et des agents pour les tâches longues.
---

Nestor voit et agit par ce que vous branchez ici. Chaque branchement est facultatif.

## Home Assistant

Home Assistant apporte à Nestor **la présence** (qui est là, et dans quelle pièce quand il le sait)
et **les appareils** (ce qu’il expose aux assistants, par son serveur MCP).

Dans Home Assistant :

1. créez un jeton d’accès longue durée (votre profil, **Sécurité**) ;
2. pour les appareils, ajoutez l’intégration **Model Context Protocol Server** et choisissez les
   entités dans **Paramètres › Assistants vocaux › Exposer**.

Dans `.env` :

```ini
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_MCP_URL=http://homeassistant.local:8123/api/mcp
HOME_ASSISTANT_TOKEN=eyJ...
```

Dans `nestor.yaml` (`nestor init` l’a écrit, en commentaire) :

```yaml
presence:
  kind: home-assistant
  url: ${HOME_ASSISTANT_URL}
  token: ${HOME_ASSISTANT_TOKEN}
  people:
    alex: person.alex # chaque identifiant du foyer, avec son entité personne

tools:
  - kind: mcp
    name: home
    url: ${HOME_ASSISTANT_MCP_URL}
    token: ${HOME_ASSISTANT_TOKEN}
```

`presence` accepte aussi `rooms`, un capteur par personne qui donne sa pièce (Bermuda, ESPresense).

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
  disent seulement s’il lit ou s’il écrit ; rien ne demande de confirmation sans `sensitive`.
- `headers` ajoute des en-têtes HTTP, gardés secrets comme le jeton.

## Courrier et veilles

Branchez les boîtes mail dans l’administration, sous **Connexions**, en lecture seule : Gmail, par
votre propre application OAuth Google (l’administration vous guide), ou toute boîte IMAP avec un mot
de passe d’application.

Demandez ensuite une **veille** : « préviens-moi quand le plombier répond ». Un modèle
(`watches.model`) trie chaque nouveau message face aux veilles ouvertes et prévient la personne qui
l’a demandée, là où elle est. Pendant les heures calmes, il écrit, sauf urgence.

## Tâches longues

Ce qui prend des minutes va à un **exécutant**, un agent qui travaille en arrière-plan. Nestor suit
la tâche et prévient la personne quand elle est faite. Hermes est disponible aujourd’hui :

```yaml
executors:
  - kind: hermes
    base_url: https://hermes.example/v1
    api_key: ${HERMES_API_KEY}
    model: research
    description: Searches the web and writes a short report. No access to the house.
```

`model` est le profil d’agent de Hermes. `description` dit à l’agent quoi lui confier.
