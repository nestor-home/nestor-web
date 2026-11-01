---

title: Satellites
description: Devices that give Nestor a voice and a body, and how a person pairs them.
---

A satellite is a device paired with the Nestor server: a Raspberry Pi with a speaker, a tab on a
wall tablet, a Reachy Mini robot. A microphone and a speaker are the minimum. A screen, a camera or
motors are optional capabilities: the device declares them, a person allows them, and nothing in
Nestor assumes they are there.

## What a satellite does

- It pairs once and keeps its token.
- It declares in a manifest who it is and what it can do.
- It streams audio both ways over WebRTC.
- It carries out the server’s intents and acknowledges each one.
- It reports the observations it was allowed to (speech activity, a person detected).

The server asks for intents, never for motions. With `intent.expression` and `joy`, a robot moves
its head and antennas, a screen could draw a face, a plain speaker ignores it.

## Capabilities

| Capability                | The device…                                             |
| ------------------------- | ------------------------------------------------------- |
| `audio.capture`           | sends its microphone to the server                      |
| `audio.playback`          | plays the server’s voice                                |
| `audio.speech_activity`   | reports when someone starts and stops speaking          |
| `vision.person_detection` | reports a person it sees                                |
| `expression.emotion`      | shows an emotion (`intent.expression`)                  |
| `motion.head`             | moves its head with the beats of speech (`intent.beat`) |
| `device.identify`         | makes itself noticed when a person looks for it         |

## Pairing

Pairing needs a proof that a person meant it. The proof travels one of two ways, and the first one
accepted wins:

- a **device code**, six digits the device presents, which the person types in the admin;
- an **enrollment code** made in the admin (`K7QF-2M9X`), which the person gives to the device,
  usually as a pairing URI: `nestor+http://nestor.local:7860/?code=K7QF2M9X`.

| Method                    | The person…                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `device_code.display`     | reads the code on the device’s screen and types it in the admin              |
| `device_code.speech`      | hears the device say its code and types it in the admin                      |
| `enrollment.input`        | types the enrollment code on the device                                      |
| `enrollment.provisioning` | puts the pairing URI in the device’s configuration (flag, environment, file) |
| `enrollment.qr`           | shows the pairing URI’s QR code to the device’s camera                       |

Every device supports `enrollment.provisioning`; the others follow from what it has (a screen, a
speaker, a keypad, a camera). The SDKs declare them for you.

### Add a satellite

In the admin, open **Satellites**, then **Add**, and pick a method. You can name the device, put it
in a room and narrow the capabilities it gets. With an enrollment method, the admin shows the code
and its pairing URI; with a device code, it lists the devices waiting and you type the code of the
right one (**Identify** makes a device blink or chime to tell them apart).

The same from the server’s command line, while Nestor runs:

```bash
nestor satellites add --room salon --name "Living room speaker"   # prints the code and the pairing URI
nestor satellites approve 042917                                  # the device code a device presents
nestor satellites revoke enceinte-salon                           # unpairs a device
```

`approve --only audio.capture,audio.playback` grants fewer capabilities than the device declared.
Then, on the device, hand it the pairing URI:

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:7860/?code=K7QF2M9X' nestor-satellite run --room salon
```

## Ready to run

- `nestor-satellite run`: this machine’s microphone and speaker, from the
  [Python](/docs/sdks/python/), [TypeScript](/docs/sdks/typescript/) or [Rust](/docs/sdks/rust/) SDK.
- [`nestor-reachy`](https://github.com/nestor-home/nestor-reachy): Reachy Mini, whose head and
  antennas follow the conversation (its simulated twin for now).
- A browser tab, with the TypeScript SDK.

Writing your own? The [protocol](/docs/satellites/protocol/) is the standard, the
[schemas](/docs/satellites/schemas/) give each message’s shape and the
[conformance suite](/docs/satellites/conformance/) checks a device against both.
