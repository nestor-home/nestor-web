---

title: Schemas
description: The JSON Schema of every protocol message, and how an SDK keeps its copy current.
---

Every message of `nestor.satellite/1` has a JSON Schema (draft 2020-12), served at its `$id`:

```text
https://nestorhome.dev/schemas/satellite/1/<message>.json
```

The schemas come from the server release the site pins.

## Messages

Pairing, over HTTP:

| Schema                                                               | Body of                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`pairing.request`](/schemas/satellite/1/pairing.request.json)       | `POST /satellites/pairings`                                         |
| [`pairing.ticket`](/schemas/satellite/1/pairing.ticket.json)         | its `201` answer                                                    |
| [`pairing.enrollment`](/schemas/satellite/1/pairing.enrollment.json) | `POST /satellites/pairings/{pairing_id}/enrollment`                 |
| [`pairing.state`](/schemas/satellite/1/pairing.state.json)           | `GET /satellites/pairings/{pairing_id}` and the enrollment’s answer |
| [`pairing.error`](/schemas/satellite/1/pairing.error.json)           | any refusal                                                         |
| [`manifest`](/schemas/satellite/1/manifest.json)                     | the device’s manifest, in a request and in `hello`                  |

On the link, the WebSocket `/satellites/{device_id}/link`:

| Schema                                                                                 | Sent by | Means                                       |
| -------------------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| [`hello`](/schemas/satellite/1/hello.json)                                             | device  | its manifest and token, first on the link   |
| [`welcome`](/schemas/satellite/1/welcome.json)                                         | core    | the room and the capabilities allowed       |
| [`intent.expression`](/schemas/satellite/1/intent.expression.json)                     | core    | show an emotion                             |
| [`intent.behavior`](/schemas/satellite/1/intent.behavior.json)                         | core    | an attitude: listening, thinking, speaking… |
| [`intent.beat`](/schemas/satellite/1/intent.beat.json)                                 | core    | a word is played: a light accent of speech  |
| [`intent.identify`](/schemas/satellite/1/intent.identify.json)                         | core    | make yourself noticed                       |
| [`intent.text`](/schemas/satellite/1/intent.text.json)                                 | core    | the assistant’s words, to show              |
| [`input.text`](/schemas/satellite/1/input.text.json)                                   | device  | what a person typed                         |
| [`ack`](/schemas/satellite/1/ack.json)                                                 | device  | an intent was received                      |
| [`observation.speech.activity`](/schemas/satellite/1/observation.speech.activity.json) | device  | someone starts or stops speaking            |
| [`observation.person.detected`](/schemas/satellite/1/observation.person.detected.json) | device  | a person is seen                            |

## Keeping a copy in an SDK

An SDK tests every message it sends against its own copy: `src/nestor_satellite/schemas/` in Python,
`schemas/` in TypeScript and Rust. Refresh it from the server release the SDK targets, then fix the
code until the tests pass:

```bash
uvx --from nestor-home==<version> nestor satellites schemas --out schemas/
```
