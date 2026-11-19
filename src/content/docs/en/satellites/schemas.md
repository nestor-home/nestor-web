---

title: Schemas
description: The JSON Schema of every protocol message, and how an SDK keeps its copy current.
---

Every message of [`nestor.satellite/1`](/docs/satellites/protocol/) has a JSON Schema (draft
2020-12) at its `$id`, from the server release this site pins:

```text
https://nestorhome.dev/schemas/satellite/1/<message>.json
```

## Pairing

| Schema                                                               | Body of                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`pairing.request`](/schemas/satellite/1/pairing.request.json)       | `POST /satellites/pairings`                                         |
| [`pairing.ticket`](/schemas/satellite/1/pairing.ticket.json)         | its `201` answer                                                    |
| [`pairing.enrollment`](/schemas/satellite/1/pairing.enrollment.json) | `POST /satellites/pairings/{pairing_id}/enrollment`                 |
| [`pairing.state`](/schemas/satellite/1/pairing.state.json)           | `GET /satellites/pairings/{pairing_id}` and the enrollment’s answer |
| [`pairing.error`](/schemas/satellite/1/pairing.error.json)           | any refusal                                                         |
| [`manifest`](/schemas/satellite/1/manifest.json)                     | the device’s manifest, in a request and in `hello`                  |

## Link

On the WebSocket `/satellites/{device_id}/link`:

| Schema                                                                                 | Sent by | Means                                       |
| -------------------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| [`hello`](/schemas/satellite/1/hello.json)                                             | device  | its manifest and token, first on the link   |
| [`welcome`](/schemas/satellite/1/welcome.json)                                         | core    | the room and the capabilities allowed       |
| [`intent.expression`](/schemas/satellite/1/intent.expression.json)                     | core    | show an emotion                             |
| [`intent.behavior`](/schemas/satellite/1/intent.behavior.json)                         | core    | an attitude: listening, thinking, speaking… |
| [`intent.beat`](/schemas/satellite/1/intent.beat.json)                                 | core    | a word is played: a light accent of speech  |
| [`intent.identify`](/schemas/satellite/1/intent.identify.json)                         | core    | make yourself noticed                       |
| [`intent.text`](/schemas/satellite/1/intent.text.json)                                 | core    | the assistant’s words, to show              |
| [`intent.update`](/schemas/satellite/1/intent.update.json)                             | core    | install this newer version of your software |
| [`input.text`](/schemas/satellite/1/input.text.json)                                   | device  | what a person typed                         |
| [`ack`](/schemas/satellite/1/ack.json)                                                 | device  | an intent was received                      |
| [`observation.speech.activity`](/schemas/satellite/1/observation.speech.activity.json) | device  | someone starts or stops speaking            |
| [`observation.person.detected`](/schemas/satellite/1/observation.person.detected.json) | device  | a person is seen                            |
| [`update.status`](/schemas/satellite/1/update.status.json)                             | device  | where its software stands                   |
| [`intent.media.open`](/schemas/satellite/1/intent.media.open.json)                     | core    | open a media session                        |
| [`intent.media.close`](/schemas/satellite/1/intent.media.close.json)                   | core    | end a media session                         |
| [`intent.media.snapshot`](/schemas/satellite/1/intent.media.snapshot.json)             | core    | take a still picture                        |
| [`media.snapshot`](/schemas/satellite/1/media.snapshot.json)                           | device  | the picture, JPEG in base64                 |

## A copy in an SDK

Each SDK tests what it sends against its copy (`src/nestor_satellite/schemas/` in Python,
`schemas/` in TypeScript and Rust). Refresh it from the targeted server release, then fix the code
until tests pass:

```bash
uvx --from nestor-home==<version> nestor satellites schemas --out schemas/
```
