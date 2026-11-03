---

title: Satellites
description: Devices that give Nestor a voice and a body, and how a person pairs them.
---

A satellite is a device paired with the Nestor server: a Raspberry Pi with a speaker, a wall
tablet, a Reachy Mini robot. People type on it, talk to it, or both. It connects to the
`satellites` channel on port 8471, which needs a [voice](/docs/channels/#voice) to talk aloud.

## What a satellite does

It pairs once, declares its capabilities, then holds a WebSocket to the server; audio goes over
WebRTC. The server sends intents, not motions: given `intent.expression` with `joy`, a robot moves
its antennas and a plain speaker ignores it.

## Capabilities

A camera or motors are optional: the device declares them and a person allows them.

| Capability                | The device…                                             |
| ------------------------- | ------------------------------------------------------- |
| `text.input`              | sends what a person typed                               |
| `text.display`            | shows the assistant’s answers                           |
| `audio.capture`           | sends its microphone to the server                      |
| `audio.playback`          | plays the server’s voice                                |
| `audio.speech_activity`   | reports when someone starts and stops speaking          |
| `vision.person_detection` | reports a person it sees                                |
| `expression.emotion`      | shows an emotion (`intent.expression`)                  |
| `motion.head`             | moves its head with the beats of speech (`intent.beat`) |
| `device.identify`         | makes itself noticed when a person looks for it         |

## Pairing

A person proves they meant it, in one of two ways:

- a **device code**: six digits the device shows, typed in the admin;
- an **enrollment code** from the admin (`K7QF-2M9X`), given to the device, usually as a pairing
  URI: `nestor+http://nestor.local:8471/?code=K7QF2M9X`.

| Method                    | The person…                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `device_code.display`     | reads the code on the device’s screen and types it in the admin              |
| `device_code.speech`      | hears the device say its code and types it in the admin                      |
| `enrollment.input`        | types the enrollment code on the device                                      |
| `enrollment.provisioning` | puts the pairing URI in the device’s configuration (flag, environment, file) |
| `enrollment.qr`           | shows the pairing URI’s QR code to the device’s camera                       |

Every device supports `enrollment.provisioning`. The SDKs declare the others from the hardware.

### Add a satellite

In the admin, open **Satellites**, then **Add**, and pick a method. **Identify** makes a waiting
device blink or chime. From the command line, while Nestor runs:

```bash
nestor satellites add --room salon --name "Living room speaker"   # prints the code and the pairing URI
nestor satellites approve 042917                                  # the device code a device presents
nestor satellites revoke enceinte-salon                           # unpairs a device
```

`approve --only audio.capture,audio.playback` grants fewer capabilities. Then give the device its
URI:

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
```

## Ready to run

- `nestor-satellite run`, this machine’s microphone and speaker, in the
  [Python](/docs/sdks/python/), [TypeScript](/docs/sdks/typescript/) and [Rust](/docs/sdks/rust/) SDKs.
- [`nestor-reachy`](https://github.com/nestor-home/nestor-reachy), for Reachy Mini (its simulated
  twin for now).
- A browser tab, with the TypeScript SDK.

To write your own, read the [protocol](/docs/satellites/protocol/), the
[schemas](/docs/satellites/schemas/) and the [conformance suite](/docs/satellites/conformance/).
