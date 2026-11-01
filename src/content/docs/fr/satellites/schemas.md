---

title: Schémas
description: Le schéma JSON de chaque message du protocole, où ils sont servis et comment un SDK tient sa copie à jour.
---

Chaque message de `nestor.satellite/2` a un schéma JSON (draft 2020-12). Le cœur les génère à
partir de ses classes de messages, et chacun est servi là où pointe son `$id` :

```text
https://nestorhome.dev/schemas/satellite/2/<message>.json
```

Le site est construit avec les schémas de la version du serveur qu’il épingle : la version dans
l’adresse est celle que les schémas déclarent.

## Messages

L’appairage, en HTTP :

| Schéma                                                               | Corps de                                                             |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`pairing.request`](/schemas/satellite/2/pairing.request.json)       | `POST /satellites/pairings`                                          |
| [`pairing.ticket`](/schemas/satellite/2/pairing.ticket.json)         | sa réponse `201`                                                     |
| [`pairing.enrollment`](/schemas/satellite/2/pairing.enrollment.json) | `POST /satellites/pairings/{pairing_id}/enrollment`                  |
| [`pairing.state`](/schemas/satellite/2/pairing.state.json)           | `GET /satellites/pairings/{pairing_id}` et la réponse à l’enrôlement |
| [`pairing.error`](/schemas/satellite/2/pairing.error.json)           | tout refus                                                           |
| [`manifest`](/schemas/satellite/2/manifest.json)                     | le manifeste de l’appareil, dans une demande et dans `hello`         |

Sur le canal de données `nestor` :

| Schéma                                                                                 | Envoyé par | Sens                                           |
| -------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------- |
| [`hello`](/schemas/satellite/2/hello.json)                                             | appareil   | son manifeste, en premier sur le canal         |
| [`welcome`](/schemas/satellite/2/welcome.json)                                         | cœur       | la pièce et les capacités autorisées           |
| [`intent.expression`](/schemas/satellite/2/intent.expression.json)                     | cœur       | montrer une émotion                            |
| [`intent.behavior`](/schemas/satellite/2/intent.behavior.json)                         | cœur       | une attitude : écoute, réflexion, parole…      |
| [`intent.beat`](/schemas/satellite/2/intent.beat.json)                                 | cœur       | un mot est joué : un léger accent de la parole |
| [`intent.identify`](/schemas/satellite/2/intent.identify.json)                         | cœur       | se faire remarquer                             |
| [`ack`](/schemas/satellite/2/ack.json)                                                 | appareil   | une intention a été reçue                      |
| [`observation.speech.activity`](/schemas/satellite/2/observation.speech.activity.json) | appareil   | quelqu’un commence ou arrête de parler         |
| [`observation.person.detected`](/schemas/satellite/2/observation.person.detected.json) | appareil   | une personne est vue                           |

## Garder une copie dans un SDK

Un SDK garde les schémas dans son dépôt et teste avec eux chaque message qu’il envoie. Pour
rafraîchir la copie, écrivez les schémas d’une version du serveur dans le dossier du SDK :

```bash
uvx --from nestor-home==<version> nestor satellites schemas --out schemas/
```

`<version>` est la version du serveur que vise le SDK (0.0.2 ou plus récente). Adaptez ensuite le code jusqu’à ce que ses tests passent. Le SDK
Python les garde dans `src/nestor_satellite/schemas/`, les SDK TypeScript et Rust dans `schemas/`.
