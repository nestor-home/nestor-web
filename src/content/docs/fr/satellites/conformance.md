---

title: Conformité
description: Vérifier en ligne de commande qu’un satellite, quel que soit son langage, respecte le protocole.
---

La suite boîte noire du serveur lance votre satellite, quel que soit son langage, une fois par
scénario face à un faux cœur fait du vrai service d’appairage et de la vraie passerelle. Chaque
vérification nomme la [règle du protocole](/fr/docs/satellites/protocol/#12-conformité) qu’elle
prouve.

## La lancer

uvx lance la suite, avec l’extra `voice` du serveur, sans rien installer :

```bash
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance [--deadline SECONDES] -- <commande>
```

`<version>` est une version du serveur. Après `--` vient la ligne de commande de votre satellite,
où :

- `{url}` devient l’adresse du faux cœur ;
- `{state}` devient un dossier neuf, pour le jeton et tout ce que garde le satellite.

Les scénarios avec un code d’enrôlement le donnent dans `NESTOR_PAIRING_URI` (règle P1) ; les
autres retirent la variable. `--deadline` donne les secondes laissées par étape (15 par défaut).

Avec les commandes des SDK, sans carte son :

```bash
# TypeScript, depuis un projet où @nestor-home/satellite et @roamhq/wrtc sont installés
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  npx nestor-satellite run --core {url} --room salon --input none --output none --token-file {state}/token.json

# Rust
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  nestor-satellite run --core {url} --room salon --null-audio --token-file {state}/token.json
```

## Résultat

Une ligne par vérification, puis un bilan, dans la langue de `LC_ALL`, `LC_MESSAGES` ou `LANG`
(anglais ou français).

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

Sans l’extra `voice`, les vérifications audio échouent.

## En intégration continue

Lancez la même commande dans un job, après avoir construit le satellite ; seul uv est nécessaire.
Épinglez la version du serveur et montez-la avec celle du protocole.

En Python, `check_satellite(driver)` de `nestor.adapters.channels.satellites.conformance` renvoie
les résultats pour vos propres tests. `driver` est une fonction coroutine qui prend un `Launch`, ou
une commande.
