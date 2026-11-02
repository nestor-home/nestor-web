---

title: Conformité
description: Vérifier en ligne de commande qu’un satellite, quel que soit son langage, respecte le protocole.
---

Le serveur fournit une suite de conformité boîte noire. Un faux cœur, fait du vrai service
d’appairage et de la vraie passerelle, lance votre satellite une fois par scénario et vérifie ce
qu’il fait : appairage par code d’appareil et par code d’enrôlement, codes refusés, limites de
débit, identification, `hello`, acquittements, audio dans les deux sens et reconnexion. Chaque
vérification nomme la règle du [protocole](/fr/docs/satellites/protocol/) qu’elle prouve.

## La lancer

La suite a besoin de l’extra `voice` du serveur ; uvx la lance sans rien installer :

```bash
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance [--deadline SECONDES] -- <commande>
```

`<version>` est une version du serveur. Tout ce qui suit `--` est la ligne de
commande de votre satellite, où :

- `{url}` devient l’adresse du faux cœur ;
- `{state}` devient un dossier neuf, pour le jeton et tout ce que garde le satellite.

Les scénarios avec un code d’enrôlement le donnent dans `NESTOR_PAIRING_URI`, comme le ferait une
personne qui configure un appareil sans écran ; la variable est retirée dans les autres. Votre satellite doit la
lire (règle P1). `--deadline` est le nombre de secondes laissées au satellite pour chaque étape (15
par défaut).

Les commandes des SDK, sans carte son :

```bash
# TypeScript, depuis un projet où @nestor-home/satellite et @roamhq/wrtc sont installés
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  npx nestor-satellite run --core {url} --room salon --input none --output none --token-file {state}/token.json

# Rust
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  nestor-satellite run --core {url} --room salon --null-audio --token-file {state}/token.json
```

## Résultat

Une ligne par vérification, puis un bilan. Ce que le satellite écrit lui-même (son journal)
s’intercale.

```text
OK     demande à être appairé
OK     déclare enrollment.provisioning (P1)
OK     récupère son jeton une fois son code d'appareil saisi (P2)
OK     ouvre son lien avec son jeton (L1)
ÉCHEC  acquitte intent.behavior en 1 s au plus (aucun acquittement portant l'identifiant de cette intention)
...
1 vérification échouée sur 32
```

La commande écrit dans la langue de `LC_ALL`, `LC_MESSAGES` ou `LANG` (anglais ou français).

| Code de sortie | Sens                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `0`            | le satellite est conforme                                                                                |
| `1`            | une vérification a échoué                                                                                |
| `2`            | la commande ne peut pas tourner : aucune commande donnée, programme introuvable, ou extra `voice` absent |

## En intégration continue

Lancez la même commande dans un job de votre dépôt, après avoir construit le satellite. Il faut
Python (uv l’installe), mais rien du dépôt Nestor. Épinglez la version du serveur, et montez-la quand
vous passez à une nouvelle version du protocole.

En Python, la suite est aussi une fonction : `check_satellite(driver)` de
`nestor.adapters.channels.voice.satellites.conformance` prend une fonction coroutine ou une
commande, et renvoie les résultats à vérifier dans votre propre test.
