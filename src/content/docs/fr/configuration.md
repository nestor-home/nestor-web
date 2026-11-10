---

title: Configuration
description: Les fichiers que lit Nestor, ce que règle chaque section de nestor.yaml, où vont les clés, et comment un changement prend effet.
---

Nestor se règle dans `nestor.yaml`, avec ses clés dans un `.env` posé à côté ; `nestor init` écrit
les deux. Chaque partie a sa page : [Modèles](/fr/docs/models/), [Canaux et voix](/fr/docs/channels/),
[Maison et services](/fr/docs/connections/).

## Les fichiers

| Fichier       | Contient                                                                                 | Écrit par                                |
| ------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| `nestor.yaml` | la configuration : qui vit ici, quels modèles, quels canaux                              | `nestor init`, vous, ou l’administration |
| `.env`        | les clés que la configuration appelle par `${NOM}`, lisible par vous seul                | `nestor init`, puis vous                 |
| `state/`      | la base de données : journal, souvenirs, comptes, appareils appairés, coffre des secrets | Nestor (son `data_dir`)                  |

`nestor` lit les deux à chaque démarrage, dans le dossier courant ou dans le fichier que nomme
`nestor -c <fichier>`. Une variable définie dans l’environnement l’emporte sur `.env`. Sauvegardez
`state/` et `.env` ensemble : l’un garde les secrets, l’autre leur clé.

## Une première configuration

Voici ce qu’écrit `nestor init` pour une personne avec la voix des satellites (sans les
commentaires) :

```yaml
data_dir: /home/alex/nestor/state

persona:
  name: Nestor
  locale: fr
  language: French
  timezone: Europe/Paris
  character: |
    You are Nestor, the household's assistant: warm, direct, with a sense of humour.

household:
  - id: alex
    name: Alex
    accounts: []

models:
  main:
    type: language
    provider: openai-compatible
    base_url: https://openrouter.ai/api/v1
    api_key: ${MODEL_API_KEY}
    model: anthropic/claude-haiku-5.5
  ears:
    type: transcription
    provider: elevenlabs
    api_key: ${ELEVENLABS_API_KEY}
    language: fr
  voice:
    type: speech
    provider: elevenlabs
    api_key: ${ELEVENLABS_API_KEY}
    voice_id: GPAQQPp9dazaB2bl4zg9

channels:
  - kind: satellites
    host: 0.0.0.0
    voice:
      transcription: ears
      speech: voice

admin:
  host: 0.0.0.0
  port: 8470
```

Sans la voix, le bloc `voice` est en commentaire et un canal `telegram` s’ajoute. Home Assistant y
figure aussi, en commentaire.

## Les sections

Seules `persona`, `household`, `models` et `channels` sont obligatoires.

| Section      | Règle                                                                                 | Expliqué dans                                                                        |
| ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `persona`    | le nom et le caractère de l’assistant, la langue et le fuseau du foyer                | [plus bas](#langue-et-heure)                                                         |
| `household`  | les personnes, et comment chaque canal les reconnaît                                  | [plus bas](#le-foyer)                                                                |
| `models`     | les modèles de langage, sous des noms que vous choisissez                             | [Modèles](/fr/docs/models/)                                                          |
| `agent`      | quel modèle répond à voix haute et par écrit                                          | [Modèles](/fr/docs/models/#rôles)                                                    |
| `memory`     | ce que chaque tour retrouve, le modèle des résumés, la recherche par le sens          | [Modèles](/fr/docs/models/#recherche-par-le-sens), [Mémoire](/fr/docs/agent/memory/) |
| `channels`   | Telegram, les satellites et leur voix                                                 | [Canaux et voix](/fr/docs/channels/)                                                 |
| `home`       | Home Assistant : qui est là et dans quelle pièce, ses actions                         | [Maison et services](/fr/docs/connections/#home-assistant)                           |
| `tools`      | d’autres serveurs MCP dont l’agent peut utiliser les outils                           | [Maison et services](/fr/docs/connections/#serveurs-mcp)                             |
| `executors`  | des agents qui prennent les tâches longues                                            | [Maison et services](/fr/docs/connections/#tâches-longues)                           |
| `initiative` | les heures calmes, et la pièce où parler quand il sait seulement que quelqu’un est là | [Initiative](/fr/docs/agent/initiative/)                                             |
| `voices`     | le modèle de voix qui reconnaît qui parle à un satellite                              | [Locuteurs](/fr/docs/agent/speakers/)                                                |
| `watches`    | le modèle qui trie le courrier entrant pour les veilles                               | [Maison et services](/fr/docs/connections/#courrier-et-veilles)                      |
| `admin`      | l’adresse et le port de l’administration ; sans elle, pas d’administration            | [plus bas](#administration)                                                          |
| `updates`    | si l’administration signale une version plus récente                                  | [Mises à jour](/fr/docs/updates/)                                                    |

## Le foyer

Chaque personne a un `id`, un `name`, et les `accounts` qui l’identifient :

```yaml
household:
  - id: alex
    name: Alex
    accounts: ["telegram:123456789"]
  - id: sam
    name: Sam
    accounts: ["telegram:987654321"]
    may_message: [alex]
```

- `telegram:<id>` : son identifiant Telegram. Les messages d’un compte inconnu sont ignorés, et le
  journal du serveur affiche leur identifiant.
- Les satellites n’ont pas de compte : tout le monde dans la pièce peut leur parler. Voir
  [Locuteurs](/fr/docs/agent/speakers/).
- `reach` : où lui écrire quand elle est absente ou pendant les heures calmes, par exemple
  `telegram:123456789`.
- `may_message` : les personnes à qui elle peut faire écrire l’assistant ; `"*"`, tout le monde,
  par défaut.

## Langue et heure

Par défaut, Nestor parle anglais et vit en UTC. Pour passer en français :

```yaml
persona:
  locale: fr # ses phrases fixes, et la langue par défaut de l'administration
  language: French # la langue dans laquelle écrit le modèle
  timezone: Europe/Paris # l'heure du foyer : heures calmes, rappels, dates des souvenirs

models:
  ears:
    type: transcription
    provider: elevenlabs
    language: fr # la langue que transcrit la voix
```

## Clés et secrets

`${NOM}` lit `.env` ou l’environnement. `${secret:nom}` lit le coffre, chiffré dans `state/`.
Rangez un secret depuis l’administration ou avec `nestor secrets set` (saisi sans écho) :

```bash
nestor secrets set openrouter   # puis, dans nestor.yaml : api_key: ${secret:openrouter}
```

`.env` est plus simple pour commencer ; le coffre ne laisse aucune clé en clair sur le disque.
`NESTOR_SECRET_KEY`, dans `.env`, ouvre le coffre : ne le changez jamais, sinon les secrets rangés
deviennent illisibles.

## Administration

- `host` : `0.0.0.0` l’ouvre au réseau à `http://<adresse de la machine>:8470`, `127.0.0.1` la
  réserve à la machine.
- `public_url` : son adresse derrière un proxy inverse, par exemple `https://nestor.example.org`.

Les comptes vivent dans `state/`, pas dans le fichier.

## Appliquer un changement

Nestor lit sa configuration au démarrage. Après un changement, vérifiez-la, puis redémarrez
Nestor :

```bash
nestor check   # valide le fichier et construit chaque partie, sans la démarrer
```

La page **Configuration** de l’administration modifie le même fichier. Elle valide chaque
changement, garde la version précédente dans `state/config-history/`, range dans le coffre les
clés tapées, et signale quand redémarrer.
