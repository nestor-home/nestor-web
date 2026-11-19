---

title: Conformité
description: Vérifier en ligne de commande qu’un satellite, quel que soit son langage, respecte le protocole.
---

Une suite boîte noire lance votre satellite une fois par scénario face à un faux cœur (vrais
appairage et passerelle). Chaque vérification nomme sa [règle du protocole](/fr/docs/satellites/protocol/#12-conformité).

## La lancer

Rien à installer ; sans l’extra `voice`, les vérifications audio échouent.

```bash
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance [--deadline SECONDES] -- <commande>
```

| Élément      | Ce que c’est                                                                              |
| ------------ | ----------------------------------------------------------------------------------------- |
| `<version>`  | une version du serveur                                                                    |
| `<commande>` | la ligne de commande de votre satellite, après `--`                                       |
| `{url}`      | dans la commande, remplacé par l’adresse du faux cœur                                     |
| `{state}`    | dans la commande, remplacé par un dossier neuf pour le jeton et ce que garde le satellite |
| `--deadline` | secondes laissées par étape, 15 par défaut                                                |

Les scénarios d’enrôlement fixent `NESTOR_PAIRING_URI` (règle P1) ; les autres la retirent. Les SDK,
sans carte son :

```bash
# TypeScript, depuis un projet où @nestor-home/satellite et @roamhq/wrtc sont installés
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  npx nestor-satellite run --core {url} --room salon --input none --output none --token-file {state}/token.json

# Rust
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  nestor-satellite run --core {url} --room salon --null-audio --token-file {state}/token.json
```

## Résultat

Une ligne par vérification, puis un bilan, en anglais ou en français (`LC_ALL`, `LC_MESSAGES`, `LANG`).

```text
OK     demande à être appairé
OK     déclare enrollment.provisioning (P1)
OK     récupère son jeton une fois son code d'appareil saisi (P2)
OK     ouvre son lien avec son jeton, un hello d'abord, comme l'appareil appairé (L1)
ÉCHEC  acquitte intent.behavior en 1 s au plus (aucun acquittement portant l'identifiant de cette intention)
...
1 vérification échouée sur 32
```

| Code de sortie | Sens                                                                               |
| -------------- | ---------------------------------------------------------------------------------- |
| `0`            | le satellite est conforme                                                          |
| `1`            | une vérification a échoué                                                          |
| `2`            | la commande ne peut pas tourner : aucune commande donnée, ou programme introuvable |

## En intégration continue

Lancez la même commande après le build ; seul uv est nécessaire. Épinglez la version du serveur.

Dans des tests Python, `check_satellite(driver)` (`nestor.adapters.channels.satellites.conformance`)
renvoie les résultats ; `driver` est une commande ou une fonction coroutine qui prend un `Launch`.
