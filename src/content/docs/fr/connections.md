---

title: Maison et services
description: Brancher Home Assistant pour la présence et les appareils, des serveurs MCP pour d’autres outils, des boîtes mail pour les veilles, et des agents pour les tâches longues.
---

Seul, Nestor parle et se souvient. Ce qu’il peut voir et faire vient de ce que vous branchez :
Home Assistant pour la maison, des serveurs MCP pour d’autres outils, des boîtes mail pour les
veilles, et d’autres agents pour les tâches plus longues qu’une conversation. Chacun est facultatif.

## Home Assistant

Home Assistant apporte deux choses à Nestor, réglées séparément :

- **la présence** : qui est là, et dans quelle pièce quand Home Assistant le sait. Nestor s’en sert
  pour choisir où parler et savoir à qui il parle ;
- **les appareils** : lumières, volets, chauffage, capteurs, par le serveur MCP de Home Assistant.
  Nestor peut alors lire et changer ce que Home Assistant expose aux assistants.

D’abord, dans Home Assistant :

1. créez un jeton d’accès longue durée (votre profil, **Sécurité**) ;
2. pour les appareils, ajoutez l’intégration **Model Context Protocol Server**, et choisissez dans
   **Paramètres › Assistants vocaux › Exposer** les entités que les assistants peuvent voir.

Mettez ensuite les adresses et le jeton dans `.env` :

```ini
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_MCP_URL=http://homeassistant.local:8123/api/mcp
HOME_ASSISTANT_TOKEN=eyJ...
```

et ajoutez, dans `nestor.yaml` (`nestor init` a écrit ces lignes, en commentaire) :

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

`presence` accepte aussi `rooms`, un capteur par personne qui donne sa pièce (Bermuda, ESPresense),
et `occupancy_sensors`, qui remplace les capteurs de mouvement et de présence trouvés dans les
pièces de Home Assistant. Nestor suit la présence par l’API WebSocket de Home Assistant et se
reconnecte seul.

## Serveurs MCP

Tout serveur qui parle le [Model Context Protocol](https://modelcontextprotocol.io) ajoute ses
outils à l’agent. Chacun est une entrée de `tools` :

```yaml
tools:
  - kind: mcp
    name: tracker
    url: https://mcp.example.com/mcp
    token: ${TRACKER_TOKEN}
    include: [search_issues, create_issue]
```

- `include` et `exclude` choisissent les outils du serveur que voit l’agent ; tous par défaut.
- `risks` fixe le risque d’un outil par son nom (`read`, `write` ou `sensitive`), par-dessus ce que
  déclare le serveur.
- `headers` ajoute des en-têtes HTTP, gardés secrets comme le jeton ; `timeout_s` (10) borne chaque
  appel.

## Courrier et veilles

Les boîtes mail se branchent depuis l’administration, pas dans le fichier : ouvrez **Connexions**.

- **Gmail**, en lecture seule. Chaque foyer déclare sa propre application OAuth chez Google :
  l’administration affiche l’URI de redirection à déclarer chez Google, puis demande son identifiant
  et son secret, une fois. Ensuite, brancher un compte revient à se connecter avec Google.
- **Toute boîte IMAP**, en lecture seule, avec son serveur et un mot de passe d’application.

Une fois une boîte branchée, l’agent peut y chercher et y lire, et vous pouvez demander une
**veille** : « préviens-moi quand le plombier répond », « guette le colis de Lyon ». Chaque nouveau
message est trié par un modèle face aux veilles ouvertes (`watches.model`, celui de l’écrit par
défaut). Une correspondance est annoncée à la personne qui l’a demandée, là où elle est ; pendant
les heures calmes, elle est écrite plutôt que dite, sauf si elle est urgente.

## Tâches longues

L’agent reste rapide : ce qui prend des minutes est confié à un **exécutant**, un autre agent qui
travaille en arrière-plan et rend compte. Nestor suit la tâche dans son journal et prévient la
personne quand elle est faite. Hermes est l’exécutant disponible aujourd’hui :

```yaml
executors:
  - kind: hermes
    base_url: https://hermes.example/v1
    api_key: ${HERMES_API_KEY}
    model: research
    description: Searches the web and writes a short report. No access to the house.
```

`model` est le profil d’agent de Hermes. `description` dit à l’agent ce que cet exécutant peut
vraiment faire, pour qu’il ne lui confie que ce qui lui convient.
