---

title: Schemas
description: The JSON Schema of every message of the protocol, where they are served and how an SDK keeps its copy up to date.
---

Every message of `nestor.satellite/2` has a JSON Schema (draft 2020-12). The core generates them
from its message classes, and each one is served where its `$id` points:

```text
https://nestorhome.dev/schemas/satellite/2/<message>.json
```

The site is built with the schemas of the server release it pins, so the version in the address is
the one the schemas declare.

## Messages

Pairing, over HTTP:

| Schema                                                               | Body of                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`pairing.request`](/schemas/satellite/2/pairing.request.json)       | `POST /satellites/pairings`                                         |
| [`pairing.ticket`](/schemas/satellite/2/pairing.ticket.json)         | its `201` answer                                                    |
| [`pairing.enrollment`](/schemas/satellite/2/pairing.enrollment.json) | `POST /satellites/pairings/{pairing_id}/enrollment`                 |
| [`pairing.state`](/schemas/satellite/2/pairing.state.json)           | `GET /satellites/pairings/{pairing_id}` and the enrollment’s answer |
| [`pairing.error`](/schemas/satellite/2/pairing.error.json)           | any refusal                                                         |
| [`manifest`](/schemas/satellite/2/manifest.json)                     | the device’s manifest, in a request and in `hello`                  |

On the data channel `nestor`:

| Schema                                                                                 | Sent by | Means                                       |
| -------------------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| [`hello`](/schemas/satellite/2/hello.json)                                             | device  | its manifest, first thing on the channel    |
| [`welcome`](/schemas/satellite/2/welcome.json)                                         | core    | the room and the capabilities allowed       |
| [`intent.expression`](/schemas/satellite/2/intent.expression.json)                     | core    | show an emotion                             |
| [`intent.behavior`](/schemas/satellite/2/intent.behavior.json)                         | core    | an attitude: listening, thinking, speaking… |
| [`intent.beat`](/schemas/satellite/2/intent.beat.json)                                 | core    | a word is played: a light accent of speech  |
| [`intent.identify`](/schemas/satellite/2/intent.identify.json)                         | core    | make yourself noticed                       |
| [`ack`](/schemas/satellite/2/ack.json)                                                 | device  | an intent was received                      |
| [`observation.speech.activity`](/schemas/satellite/2/observation.speech.activity.json) | device  | someone starts or stops speaking            |
| [`observation.person.detected`](/schemas/satellite/2/observation.person.detected.json) | device  | a person is seen                            |

## Keeping a copy in an SDK

An SDK keeps the schemas in its repository and tests every message it sends against them. To
refresh the copy, write the schemas of a server release into the SDK’s folder:

```bash
uvx --from nestor-home==<version> nestor satellites schemas --out schemas/
```

`<version>` is the server release the SDK targets (0.0.2 or later). Then adapt the code until its tests pass. The Python SDK keeps
them in `src/nestor_satellite/schemas/`, the TypeScript and Rust SDKs in `schemas/`.
