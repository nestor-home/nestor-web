---

title: Maison et services
description: Brancher Home Assistant pour la présence et les appareils, la recherche web, la météo et les cartes, des serveurs MCP pour d’autres outils, des comptes (mails, agendas, fichiers, contacts, tâches) pour l’agent et les veilles, et des agents pour les tâches longues.
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

## Comptes connectés

Connectez les comptes dans l’administration, sous **Connexions** : choisissez un service, puis la
personne à qui le compte appartient, ou tout le foyer. Le compte d’une personne ne sert qu’à elle ;
un compte du foyer sert à tout le monde.

| Service           | Ce que l’agent y trouve                                | Noms `@`                                               | Connexion                                       |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------- |
| Google            | Gmail, Agenda, Drive, Contacts, Tasks                  | `@gmail`, `@calendar`, `@drive`, `@contacts`, `@tasks` | votre propre client OAuth                       |
| Microsoft 365     | mails et agenda Outlook, OneDrive, To Do               | `@outlook`, `@calendar`, `@onedrive`, `@todo`          | votre propre inscription d’application          |
| CalDAV et CardDAV | les agendas et contacts d’iCloud, Fastmail, Nextcloud… | `@calendar`, `@contacts`                               | un identifiant et un mot de passe d’application |
| IMAP              | toute boîte mail                                       | `@mail`                                                | un identifiant et un mot de passe d’application |

Aucun n’envoie, ne supprime ni ne modifie un mail, un fichier ou un contact. Ils lisent, et ajoutent
des événements et des tâches après avoir demandé (voir [Écritures](#écritures)).

### Google

- **Gmail** : cherche et lit le courrier, avec la syntaxe de recherche de Gmail (`from:`,
  `newer_than:7d`). Les nouveaux messages alimentent les [veilles](#courrier-et-veilles).
- **Agenda** : liste les événements de l’agenda principal et en ajoute un.
- **Drive** : cherche des fichiers et en lit un : un document, une feuille (en CSV) ou une
  présentation Google, un PDF ou un fichier texte.
- **Contacts** : trouve des personnes par nom, adresse, téléphone ou entreprise.
- **Tasks** : liste les tâches ouvertes de la liste par défaut, en ajoute une et en coche une.

Google se connecte avec le propre client OAuth du foyer, créé une seule fois en une dizaine de
minutes. L’administration montre chaque étape avec ses liens ; en bref, dans la
[console Google Cloud](https://console.cloud.google.com/) :

1. créez un projet et activez les API Gmail, Google Calendar, Google Drive, People et Google Tasks.
   Une API laissée désactivée retire seulement ses outils ;
2. dans **Google Auth Platform**, configurez l’écran de consentement pour une audience **Externe**
   et ajoutez les champs d’application `openid`, `email` et, sous
   `https://www.googleapis.com/auth/`, `gmail.readonly`, `calendar.events`, `drive.readonly`,
   `contacts.readonly` et `tasks` ;
3. publiez l’application (**En production**) : sinon Google met fin à l’autorisation après 7 jours.
   Elle ne sert qu’à vous, elle n’a pas besoin de validation ;
4. créez un client **Application Web** avec l’URI de redirection qu’affiche l’administration, puis
   collez son ID et son secret dans l’administration et cliquez sur **Connecter**. Google prévient
   qu’il n’a pas validé l’application : choisissez **Paramètres avancés**, puis **Accéder à Nestor**.

### Microsoft 365

Comptes professionnels, scolaires et personnels, par Microsoft Graph.

- **Mails Outlook** : cherche et lit le courrier (`from:`, `subject:` et `received:` fonctionnent).
  Les nouveaux messages alimentent les [veilles](#courrier-et-veilles).
- **Agenda** : liste les événements de l’agenda Outlook et en ajoute un.
- **OneDrive** : cherche des fichiers et en lit un : un document Word, Excel ou PowerPoint, un
  fichier OpenDocument, un PDF ou un fichier texte.
- **To Do** : liste les tâches ouvertes de la liste par défaut, en ajoute une et en coche une.

Microsoft se connecte avec la propre inscription d’application du foyer, créée une seule fois en
une dizaine de minutes. L’administration montre chaque étape ; en bref, dans les
[inscriptions d’applications](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
du portail Azure :

1. inscrivez une application pour les **Comptes dans un annuaire d’organisation et comptes
   Microsoft personnels**, avec un URI de redirection **Web** : celui qu’affiche l’administration ;
2. dans **API autorisées**, ajoutez ces autorisations déléguées de Microsoft Graph :
   `offline_access`, `openid`, `email`, `User.Read`, `Mail.Read`, `MailboxSettings.Read`,
   `Calendars.ReadWrite`, `Files.Read` et `Tasks.ReadWrite`. Pour un compte professionnel, son
   administrateur devra peut-être les accorder ;
3. dans **Certificats et secrets**, créez un secret client et copiez sa **Valeur**. Il expire au
   plus tard après 24 mois : créez le suivant avant ;
4. collez l’**ID d’application (client)** et le secret dans l’administration, puis cliquez sur
   **Connecter**.

### CalDAV et CardDAV

- **Agendas** : liste les événements de tous les agendas et en ajoute un, dans l’agenda nommé ou le
  premier qui l’accepte.
- **Contacts** : trouve des personnes par nom, adresse, téléphone ou entreprise.

Renseignez le serveur CalDAV, le serveur CardDAV s’il est différent, l’identifiant et un mot de
passe d’application. Nestor trouve les agendas et les carnets d’adresses à partir de l’adresse du
serveur, ou de son adresse bien connue (`.well-known`). Les adresses sont en `https://` ; `http://`
ne fonctionne que sur la machine où tourne Nestor.

- **iCloud** : CalDAV `https://caldav.icloud.com`, CardDAV `https://contacts.icloud.com`,
  l’adresse de votre compte Apple comme identifiant. Créez le mot de passe sur
  [account.apple.com](https://account.apple.com), **Connexion et sécurité**, **Mots de passe pour
  app**.
- **Fastmail** : CalDAV `https://caldav.fastmail.com`, CardDAV `https://carddav.fastmail.com`,
  votre adresse Fastmail comme identifiant. Créez le mot de passe dans **Paramètres**,
  **Confidentialité et sécurité**, **Gérer les mots de passe d’application**, avec l’accès CalDAV
  et CardDAV.
- **Nextcloud** : `https://<votre Nextcloud>/remote.php/dav` pour les deux, votre nom d’utilisateur
  comme identifiant. Créez le mot de passe dans **Paramètres personnels**, **Sécurité**, **Créer
  un nouveau mot de passe d’application**.

Pour un autre serveur (Synology, Radicale, Baïkal), prenez les adresses que donne sa documentation.

### IMAP

Toute boîte mail, en lecture seule : Nestor cherche et lit le courrier, et les nouveaux messages
alimentent les [veilles](#courrier-et-veilles). Utilisez un mot de passe d’application ;
l’administration donne les serveurs des fournisseurs courants. Microsoft n’accepte plus de mot de
passe en IMAP pour les comptes Outlook personnels : connectez-les avec Microsoft 365.

### Mentions

Dans un message, le nom d’un service désigne ce compte à l’agent : « ajoute le dentiste à
`@calendar` ». Quand deux comptes portent le même nom, le début de l’adresse les distingue :
`@calendar-alex`. Voir [Mentions](/fr/docs/channels/#mentions).

### Écritures

Les outils qui écrivent (ajouter un événement, ajouter une tâche, en cocher une) demandent d’abord
l’accord de la personne tant que **Demander confirmation avant d’écrire** est activé sur la
connexion, ce qui est le cas par défaut (voir
[Actions sensibles](/fr/docs/agent/speakers/#actions-sensibles)). Sur la même page, chaque outil a
son interrupteur.

### Réglages

`connectors` dans `nestor.yaml` liste les services que propose l’administration ; sans lui, tous
ceux installés. Google et Microsoft 365 acceptent ces clés facultatives :

```yaml
connectors:
  - kind: google
    poll_interval_s: 30 # tous les combien le nouveau courrier est lu pour les veilles (60 pour Microsoft)
    body_chars: 20000 # le plus long mail ou fichier lu, en caractères
    file_bytes: 20000000 # le plus gros fichier lu
    excerpt_chars: 2000 # l’extrait de chaque mail que trient les veilles
  - kind: microsoft
  - kind: dav
  - kind: imap
```

Une recherche rend au plus 20 mails ou fichiers, 30 contacts, 50 événements ou 100 tâches.

## Courrier et veilles

Demandez une **veille** : « préviens-moi quand le plombier répond ». Un modèle (`watches.model`)
trie chaque nouveau message des boîtes Gmail, Outlook et IMAP connectées face aux veilles ouvertes
et prévient la personne qui l’a demandée, là où elle est (voir [Initiative](/fr/docs/agent/initiative/)).

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
