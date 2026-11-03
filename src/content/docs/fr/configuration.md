---

title: Configuration
description: Les fichiers que lit Nestor, ce que règle chaque section de nestor.yaml, où vont les clés, et comment un changement prend effet.
---

Tout ce que fait Nestor se règle dans un fichier, `nestor.yaml`, avec ses clés dans un `.env` posé
à côté. `nestor init` écrit les deux ; cette page explique ce qu’ils contiennent. Les pages
suivantes règlent chaque partie : [Modèles](/fr/docs/models/), [Canaux et voix](/fr/docs/channels/),
[Maison et services](/fr/docs/connections/).

## Les fichiers

| Fichier       | Contient                                                                                 | Écrit par                                |
| ------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| `nestor.yaml` | la configuration : qui vit ici, quels modèles, quels canaux                              | `nestor init`, vous, ou l’administration |
| `.env`        | les clés que la configuration appelle par `${NOM}`, lisible par vous seul                | `nestor init`, puis vous                 |
| `state/`      | la base de données : journal, souvenirs, comptes, appareils appairés, coffre des secrets | Nestor (son `data_dir`)                  |

`nestor` lit le `nestor.yaml` du dossier courant, ou le fichier que nomme `nestor -c <fichier>`,
et le `.env` posé à côté à chaque démarrage. Une variable déjà définie dans l’environnement (le
shell, un gestionnaire de services, Docker) l’emporte sur le fichier. Sauvegardez `state/` et
`.env` ensemble : l’un garde les secrets, l’autre la clé qui les ouvre.

## Une première configuration

Voici ce qu’écrit `nestor init`, sans ses commentaires, pour un foyer d’une personne avec la voix
des satellites :

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
    accounts: ["satellites:*"]

models:
  main:
    kind: openai-compatible
    base_url: https://openrouter.ai/api/v1
    api_key: ${MODEL_API_KEY}
    model: anthropic/claude-haiku-5.5

channels:
  - kind: satellites
    host: 0.0.0.0
    voice:
      speech:
        api_key: ${ELEVENLABS_API_KEY}
        voice_id: GPAQQPp9dazaB2bl4zg9
        language: fr

admin:
  host: 0.0.0.0
  port: 8470
```

Sans la voix, le bloc `voice` reste en commentaire et un canal `telegram` s’ajoute. Le fichier
porte aussi Home Assistant, en commentaire, prêt à remplir.

## Les sections

Seules `persona`, `household`, `models` et `channels` sont obligatoires.

| Section      | Règle                                                                                                 | Expliqué dans                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `persona`    | le nom et le caractère de l’assistant, la langue et le fuseau du foyer                                | [plus bas](#langue-et-heure)                                                         |
| `household`  | les personnes, et comment chaque canal les reconnaît                                                  | [plus bas](#le-foyer)                                                                |
| `models`     | les modèles de langage, sous des noms que vous choisissez                                             | [Modèles](/fr/docs/models/)                                                          |
| `agent`      | quel modèle répond à voix haute, par écrit, et aux réveils                                            | [Modèles](/fr/docs/models/#rôles)                                                    |
| `memory`     | ce que chaque tour retrouve, le modèle des résumés, la recherche par le sens                          | [Modèles](/fr/docs/models/#recherche-par-le-sens), [Mémoire](/fr/docs/agent/memory/) |
| `channels`   | Telegram, les satellites et leur voix                                                                 | [Canaux et voix](/fr/docs/channels/)                                                 |
| `presence`   | qui est là et dans quelle pièce, depuis Home Assistant                                                | [Maison et services](/fr/docs/connections/#home-assistant)                           |
| `tools`      | les serveurs MCP dont l’agent peut utiliser les outils : les appareils de Home Assistant, et d’autres | [Maison et services](/fr/docs/connections/#serveurs-mcp)                             |
| `executors`  | des agents qui prennent les tâches longues                                                            | [Maison et services](/fr/docs/connections/#tâches-longues)                           |
| `initiative` | les heures calmes, et la pièce où parler quand il sait seulement que quelqu’un est là                 | [Initiative](/fr/docs/agent/initiative/)                                             |
| `watches`    | le modèle qui trie le courrier entrant pour les veilles                                               | [Maison et services](/fr/docs/connections/#courrier-et-veilles)                      |
| `admin`      | l’adresse et le port de l’administration ; sans elle, pas d’administration                            | [plus bas](#administration)                                                          |

## Le foyer

Chaque personne a un `id` (repris partout ailleurs dans le fichier), un `name`, et les `accounts`
qui l’identifient sur chaque canal :

```yaml
household:
  - id: alex
    name: Alex
    accounts: ["telegram:123456789", "satellites:*"]
  - id: sam
    name: Sam
    accounts: ["telegram:987654321"]
    may_message: [alex]
```

- `telegram:<id>` est son identifiant d’utilisateur Telegram. Un message d’un compte inconnu est
  ignoré, et le journal du serveur affiche son identifiant.
- `satellites:*` attribue à cette personne tout ce qui est dit ou tapé sur un satellite. Dans un
  foyer de plusieurs, ne le donnez qu’à une seule.
- `reach`, une adresse comme `telegram:123456789`, est l’endroit où lui écrire quand parler ne
  convient pas : elle est absente, ou ce sont les heures calmes.
- `may_message` liste les personnes à qui elle peut faire écrire l’assistant : des identifiants, ou
  `"*"` pour tout le monde, la valeur par défaut.

## Langue et heure

Sans ces réglages, Nestor parle anglais et vit en UTC. `nestor init` les règle d’après vos
réponses. Pour passer une configuration existante en français :

```yaml
persona:
  locale: fr # ses phrases fixes, et la langue par défaut de l'administration
  language: French # la langue dans laquelle écrit le modèle
  timezone: Europe/Paris # l'heure du foyer : heures calmes, rappels, dates des souvenirs

channels:
  - kind: satellites
    voice:
      speech:
        language: fr # la langue que transcrit la voix
```

## Clés et secrets

Une valeur écrite `${NOM}` vient de `.env` ou de l’environnement. Une valeur écrite
`${secret:nom}` vient du coffre : chiffré dans `state/`, réglé avec `nestor secrets set <nom>`
(saisi sans écho) ou depuis l’administration, listé avec `nestor secrets list`.

```bash
nestor secrets set openrouter   # puis, dans nestor.yaml : api_key: ${secret:openrouter}
```

`.env` est plus simple pour commencer. Le coffre ne laisse aucune clé en clair sur le disque, et
l’administration peut les changer. `NESTOR_SECRET_KEY`, dans `.env`, ouvre le coffre : `nestor init`
le génère. Ne le changez jamais, sinon les secrets déjà rangés deviennent illisibles.

## Administration

L’administration écoute sur le port 8470. `host: 0.0.0.0` permet aux autres appareils du réseau de
l’ouvrir à `http://<adresse de la machine>:8470` ; `127.0.0.1` la réserve à la machine elle-même.
`public_url` est son adresse telle que la joignent les navigateurs du foyer, derrière un proxy
inverse par exemple (`https://nestor.example.org`). Qui peut se connecter n’est pas dans le fichier :
les comptes vivent dans `state/` (`nestor init`, ou `nestor accounts create-owner`).

## Appliquer un changement

Nestor lit sa configuration au démarrage. Après avoir modifié `nestor.yaml` ou `.env` :

```bash
nestor check   # valide le fichier et construit chaque partie, sans la démarrer
```

Puis redémarrez Nestor. La page **Configuration** de l’administration modifie le même fichier : elle
vérifie un changement avant de l’écrire, garde la version précédente dans `state/config-history/`,
range dans le coffre les clés que vous tapez, et signale quand un redémarrage est nécessaire.
