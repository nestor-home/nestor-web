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
its antennas. A plain speaker never gets it, since it did not declare `expression.emotion`.

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
| `device.update`           | installs a newer version of its software when asked     |
| `video.capture`           | films, in the sessions a person opens                   |
| `media.indicator`         | shows that it films or is in a call                     |

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

### Update a satellite

A satellite allowed `device.update` can be updated from its page in the admin: see
[Updates](/docs/updates/#update-a-satellite).

## Cameras and calls

From the admin’s **Cameras** page, a person can watch what a satellite allowed `video.capture`
films, take a still picture, or call a satellite that hears and plays sound: talk through it and
hear the room, with its video when it films. Nothing leaves a device outside a session a person
opened. The device connects to the server only, which relays to the browser, and it shows that it
films or is in a call. During a call, the assistant does not listen to that room. Each session and
picture goes in the journal; pictures are kept 7 days.

Owners watch and call every device (`media.view.all`, `media.call.all`). Admins and members
(`media.view`, `media.call`) use only the devices that list them, set on each satellite’s page.
This needs the server’s `media` extra (`pip install 'nestor-home[media]'`), and a satellite films
only over TLS (`wss`), unless it runs on the server’s machine.

The assistant can look too. Asked “is the light on in the living room?” in writing from a person’s
own account, it takes a picture with the `look` tool and looks at it, when that person may see the
room and its model sees images. Asked aloud, it asks them to write from their account: a voice
does not prove who speaks.

### Privacy

A camera films whenever someone allowed asks, unless you set rules for it. On each satellite’s page,
next to who may watch, you can add:

- **quiet hours**: time slots in the household’s time, on the days you pick, which may run past
  midnight (22:00 to 07:00);
- **off while someone is home**: anyone, or the people you pick, as Home Assistant sees them. When
  Home Assistant cannot tell, the camera stays off.

A rule applies to live views, pictures, the video of a call and `look`, and ends a session it no
longer allows. The journal says why.

## Ready to run

- `nestor-satellite run`, this machine’s microphone and speaker, in the
  [Python](/docs/sdks/python/), [TypeScript](/docs/sdks/typescript/) and [Rust](/docs/sdks/rust/)
  SDKs.
- [`nestor-reachy`](https://github.com/nestor-home/nestor-reachy), for Reachy Mini in simulation:
  it refuses a physical robot until its safety policy is validated on hardware.
- A browser tab, with the TypeScript SDK.

To write your own, read the [protocol](/docs/satellites/protocol/), the
[schemas](/docs/satellites/schemas/) and the [conformance suite](/docs/satellites/conformance/).
