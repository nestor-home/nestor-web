---

title: Schémas
description: Le schéma JSON de chaque message du protocole, et comment un SDK tient sa copie à jour.
---

Chaque message de `nestor.satellite/1` a un schéma JSON (draft 2020-12), servi à son `$id` :

```text
https://nestorhome.dev/schemas/satellite/1/<message>.json
```

Les schémas viennent de la version du serveur que le site épingle.

## Messages

L’appairage, en HTTP :

| Schéma                                                               | Corps de                                                             |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`pairing.request`](/schemas/satellite/1/pairing.request.json)       | `POST /satellites/pairings`                                          |
| [`pairing.ticket`](/schemas/satellite/1/pairing.ticket.json)         | sa réponse `201`                                                     |
| [`pairing.enrollment`](/schemas/satellite/1/pairing.enrollment.json) | `POST /satellites/pairings/{pairing_id}/enrollment`                  |
| [`pairing.state`](/schemas/satellite/1/pairing.state.json)           | `GET /satellites/pairings/{pairing_id}` et la réponse à l’enrôlement |
| [`pairing.error`](/schemas/satellite/1/pairing.error.json)           | tout refus                                                           |
| [`manifest`](/schemas/satellite/1/manifest.json)                     | le manifeste de l’appareil, dans une demande et dans `hello`         |

Sur le lien, le WebSocket `/satellites/{device_id}/link` :

| Schéma                                                                                 | Envoyé par | Sens                                               |
| -------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------- |
| [`hello`](/schemas/satellite/1/hello.json)                                             | appareil   | son manifeste et son jeton, en premier sur le lien |
| [`welcome`](/schemas/satellite/1/welcome.json)                                         | cœur       | la pièce et les capacités autorisées               |
| [`intent.expression`](/schemas/satellite/1/intent.expression.json)                     | cœur       | montrer une émotion                                |
| [`intent.behavior`](/schemas/satellite/1/intent.behavior.json)                         | cœur       | une attitude : écoute, réflexion, parole…          |
| [`intent.beat`](/schemas/satellite/1/intent.beat.json)                                 | cœur       | un mot est joué : un léger accent de la parole     |
| [`intent.identify`](/schemas/satellite/1/intent.identify.json)                         | cœur       | se faire remarquer                                 |
| [`intent.text`](/schemas/satellite/1/intent.text.json)                                 | cœur       | les mots de l’assistant, à afficher                |
| [`intent.update`](/schemas/satellite/1/intent.update.json)                             | cœur       | installer cette version plus récente du logiciel   |
| [`input.text`](/schemas/satellite/1/input.text.json)                                   | appareil   | ce qu’une personne a tapé                          |
| [`ack`](/schemas/satellite/1/ack.json)                                                 | appareil   | une intention a été reçue                          |
| [`observation.speech.activity`](/schemas/satellite/1/observation.speech.activity.json) | appareil   | quelqu’un commence ou arrête de parler             |
| [`observation.person.detected`](/schemas/satellite/1/observation.person.detected.json) | appareil   | une personne est vue                               |
| [`update.status`](/schemas/satellite/1/update.status.json)                             | appareil   | où en est son logiciel                             |

## Garder une copie dans un SDK

Un SDK vérifie chaque message qu’il envoie avec sa propre copie : `src/nestor_satellite/schemas/` en
Python, `schemas/` en TypeScript et en Rust. Rafraîchissez-la depuis la version du serveur que vise
le SDK, puis corrigez le code jusqu’à ce que les tests passent :

```bash
uvx --from nestor-home==<version> nestor satellites schemas --out schemas/
```
