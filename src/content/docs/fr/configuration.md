---

title: Configuration
description: La carte de nestor.yaml, les fichiers posés à côté, et comment un changement prend effet.
---

Nestor se règle dans un seul fichier, `nestor.yaml`, écrit par `nestor init`.

## Les fichiers

| Fichier       | Contient                                                                      | Écrit par                                |
| ------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| `nestor.yaml` | qui vit ici, quels modèles, quels canaux                                      | `nestor init`, vous, ou l’administration |
| `.env`        | les clés que la configuration appelle par `${NOM}`, lisible par vous seul     | `nestor init`, puis vous                 |
| `state/`      | la base : journal, souvenirs, comptes, appareils appairés, coffre des secrets | Nestor (son `data_dir`)                  |

Nestor lit le dossier courant, ou `nestor -c <fichier>`. L’environnement l’emporte sur `.env`.
Sauvegardez `state/` et `.env` ensemble : l’un garde les secrets, l’autre leur clé.

## Les sections

Seules `persona`, `household`, `models` et `channels` sont obligatoires.

| Section      | Règle                                                                            | Page                                                  |
| ------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `persona`    | le nom et le caractère de l’assistant, la langue et le fuseau du foyer           | [Langue et heure](#langue-et-heure)                   |
| `household`  | les personnes, et comment chaque canal les reconnaît                             | [Le foyer](#le-foyer)                                 |
| `models`     | tous les modèles, sous des noms que vous choisissez                              | [Modèles](/fr/docs/models/)                           |
| `agent`      | quel modèle tient chaque rôle                                                    | [Rôles](/fr/docs/models/#rôles)                       |
| `memory`     | ce que chaque tour retrouve, la recherche par le sens                            | [Mémoire](/fr/docs/agent/memory/)                     |
| `channels`   | la discussion de l’admin, les messageries, les satellites                        | [Canaux](/fr/docs/channels/), [Voix](/fr/docs/voice/) |
| `home`       | Home Assistant : qui est là, dans quelle pièce, ses actions                      | [Maison](/fr/docs/home/)                              |
| `tools`      | recherche web, météo, cartes, serveurs MCP                                       | [Outils](/fr/docs/tools/)                             |
| `executors`  | des agents qui prennent les tâches longues                                       | [Exécutants](/fr/docs/executors/)                     |
| `initiative` | les heures calmes, et où parler quand il sait seulement que quelqu’un est là     | [Initiative](/fr/docs/agent/initiative/)              |
| `voices`     | le modèle de locuteur qui reconnaît qui parle à un satellite                     | [Locuteurs](/fr/docs/agent/speakers/)                 |
| `watches`    | le modèle qui trie ce qui arrive pour les veilles                                | [Comptes](/fr/docs/accounts/)                         |
| `connectors` | les services auxquels l’admin relie des comptes ; tous ceux installés par défaut | [Comptes](/fr/docs/accounts/)                         |
| `inbound`    | les flux d’actualité, pages web et webhooks que suivent les veilles              | [Outils](/fr/docs/tools/)                             |
| `admin`      | l’adresse et le port de l’administration ; sans elle, pas d’administration       | [Administration](#administration)                     |
| `updates`    | si l’administration signale une version plus récente                             | [Mises à jour](/fr/docs/updates/)                     |
| `prices`     | d’où vient le prix d’un appel quand le fournisseur ne le dit pas                 | [Coûts](/fr/docs/costs/)                              |

## Le foyer

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

| Clé           | Rôle                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `accounts`    | qui elle est sur chaque canal, par exemple `telegram:<identifiant>` ; un compte inconnu est ignoré et son identifiant journalisé |
| `reach`       | où Nestor lui écrit quand il ne le dit pas à voix haute, par exemple `telegram:123456789`                                        |
| `may_message` | les personnes à qui elle peut faire écrire Nestor ; `"*"`, tout le monde, par défaut. Elle peut toujours s’écrire à elle-même    |

Les satellites n’ont pas de compte ([Locuteurs](/fr/docs/agent/speakers/)).

## Langue et heure

Anglais et UTC par défaut. En français :

```yaml
persona:
  locale: fr # ses phrases fixes, et la langue par défaut de l'administration
  language: French # la langue dans laquelle écrit le modèle
  timezone: Europe/Paris # heures calmes, rappels, dates des souvenirs
```

La voix entend la langue de son [modèle de transcription](/fr/docs/voice/).

## Clés et secrets

| Écrit           | Lit                              |
| --------------- | -------------------------------- |
| `${NOM}`        | `.env`, ou l’environnement       |
| `${secret:nom}` | le coffre, chiffré dans `state/` |

Rangez un secret depuis l’administration, ou :

```bash
nestor secrets set openrouter   # puis, dans nestor.yaml : api_key: ${secret:openrouter}
```

`NESTOR_SECRET_KEY`, dans `.env`, ouvre le coffre. Ne le changez jamais, sinon les secrets
deviennent illisibles.

## Administration

| Clé          | Défaut      | Rôle                                                                            |
| ------------ | ----------- | ------------------------------------------------------------------------------- |
| `host`       | `127.0.0.1` | `0.0.0.0` l’ouvre au réseau à `http://<adresse de la machine>:8470`             |
| `port`       | `8470`      | son port                                                                        |
| `public_url` |             | son adresse derrière un proxy inverse, par exemple `https://nestor.example.org` |

Invitez quelqu’un depuis **Comptes** : vous recevez un lien à lui envoyer. Chaque compte a un rôle :

| Rôle           | Peut                                                                          |
| -------------- | ----------------------------------------------------------------------------- |
| propriétaire   | tout, y compris sur les autres propriétaires ; il y en a toujours au moins un |
| administrateur | faire tourner l’assistant du foyer, sans toucher aux propriétaires            |
| membre         | voir et gérer ses conversations, ses souvenirs, ses tâches et ses connexions  |
| invité         | voir ce que l’assistant sait de lui                                           |

## Appliquer un changement

Nestor lit sa configuration au démarrage :

```bash
nestor check     # valide le fichier et construit chaque partie, sans la démarrer
nestor restart   # redémarre l'instance en marche
```

La page **Configuration** de l’administration modifie le même fichier, garde la version précédente
dans `state/config-history/`, range les clés tapées dans le coffre et dit quand redémarrer.
