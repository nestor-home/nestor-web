---

title: Python SDK
description: Write a satellite in Python with nestor-satellite, or run its command on any machine, aloud or in writing.
---

[`nestor-satellite`](https://pypi.org/project/nestor-satellite/) handles pairing, the token, the
manifest, the WebSocket link and text. Audio over WebRTC is the `voice` extra: a device that only
writes installs none of it. It does not depend on the Nestor server. Python 3.12 or later.

```bash
pip install 'nestor-satellite[voice,sounddevice]'   # voice: WebRTC audio; sounddevice: the machine's microphone and speaker
pip install nestor-satellite                        # a device that only writes
```

The `qr` extra adds QR code reading (ZXing-C++), for a device with a camera.

## A minimal driver

A speaker with a microphone, a light and a text output, paired the first time, connected from then
on:

```python
import asyncio

from nestor_satellite import EXPRESSION, IDENTIFY, Body, Device, Manifest, Satellite, TokenStore
from nestor_satellite.devices import Microphone, Speaker


class Led(Body):
    def behavior(self, behavior):
        print("attitude:", behavior)  # idle, listening, thinking, speaking

    def expression(self, expression, intensity):
        print("expression:", expression, intensity)

    def identify(self):
        print("blink!")  # a person is telling devices apart


satellite = Satellite(
    "http://nestor.local:8471",
    Manifest.of(Device("enceinte-salon", "raspberry-pi-4", "salon"), EXPRESSION, IDENTIFY),
    tokens=TokenStore("~/.config/nestor-satellite/enceinte-salon.json"),
    body=Led(),
    source=Microphone(),  # audio.capture, with the voice extra
    sink=Speaker(),  # audio.playback
    text_display=lambda text, final: print(text),  # text.display
    text_input=True,  # text.input: satellite.send_text("…")
)
asyncio.run(satellite.run())  # pairs the first time, then stays connected and reconnects
```

With no enrollment code, it asks for a device code and says it on its speaker, digit by digit,
twice, with recorded clips shipped in the package (offline, English or French), and logs it. Type
it in the admin. With `NESTOR_PAIRING_URI` set, it pairs at once.

## Text and audio

The manifest lists the device and what its body and sensors do (`EXPRESSION`, `IDENTIFY`,
`HEAD_MOTION`, `PERSON_DETECTION`, `SPEECH_ACTIVITY`). The text and audio capabilities follow from
what you give the satellite. Declaring one of them in the manifest raises `ValueError`.

| Argument                                    | Declares         |
| ------------------------------------------- | ---------------- |
| `text_display=` a function `(text, final)`  | `text.display`   |
| `text_input=True`                           | `text.input`     |
| `source=` an `AudioSource` (`Microphone()`) | `audio.capture`  |
| `sink=` an `AudioSink` (`Speaker()`)        | `audio.playback` |

- `satellite.send_text("…")` sends what a person typed, 1 to 4,000 characters, as a turn of the
  room’s conversation. It returns `False` while the link is down (nothing is queued), and raises
  `CapabilityNotAllowed` when `text.input` was not given or the household did not allow it.
- An answer can come in several messages (the assistant says it is looking, then gives the result);
  `final` marks the last one of a turn. A typed turn is answered in writing when the device shows
  text, aloud otherwise.
- `source` and `sink` need the `voice` extra. The satellite offers WebRTC only once the core has
  allowed audio; until then, and on a device without audio, everything goes through the link.
  `ice_servers=` (STUN or TURN URLs) is only needed beyond the local network.
- The link closes for good when a newer link of the same device replaces it (`4409`): `run` returns.
  A refused token (`4401`) is forgotten and the device pairs again; any other close reconnects,
  waiting longer each time.

## Pairing options

The manifest’s pairing methods follow from what you pass; you never list them by hand.

| Argument                                                                  | Declares                  |
| ------------------------------------------------------------------------- | ------------------------- |
| always                                                                    | `enrollment.provisioning` |
| `display=` a `Display` (`show(text, code)`, `clear()`)                    | `device_code.display`     |
| `voice=` a function that says a sentence, or a `sink` without a `display` | `device_code.speech`      |
| `enrolls_by=[PairingMethod.INPUT]`                                        | `enrollment.input`        |
| `camera=AvCamera(…)`                                                      | `enrollment.qr`           |

- `enrollment=` takes a pairing URI or an enrollment code; by default it is read from
  `NESTOR_PAIRING_URI`, else `NESTOR_PAIRING_CODE`. With a pairing URI, the core’s address may be
  `None`.
- A device with neither a screen nor a speaker only logs its device code.
- A code typed on the device while it waits: `await satellite.enroll("K7QF-2M9X")` returns
  `ACCEPTED`, `REFUSED` (never sent again, even after a restart), `NOT_PENDING` (the device code
  won) or `INVALID`.
- `locale="fr"` sets the language it speaks to people (default: the environment’s).
- Failures that waiting cannot fix (a core speaking another protocol version, a request it
  rejects) stop `run` with `PairingFailed`, said on every output. A core that is down is retried.
- `AvCamera("0", format="avfoundation")` reads the first camera on macOS,
  `AvCamera("/dev/video0", format="v4l2")` on Linux (`qr` extra).

## The command

To use this machine’s microphone and speaker as a satellite without writing code (with the `voice`
and `sounddevice` extras):

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
# or
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# or, the core's address given apart
nestor-satellite run --core http://nestor.local:8471 --room salon --pairing-code K7QF-2M9X
# in writing only: lines typed on stdin are sent, the answers printed (no extra needed)
nestor-satellite run --core http://nestor.local:8471 --room bureau --text --no-voice
```

`--text` adds writing to the voice, `--no-voice` drops the microphone and the speaker. Without a
code, `nestor-satellite run --core http://nestor.local:8471 --room salon` says a device code (with
`--no-voice`, it only logs it). `--camera 0` reads QR codes (with the `qr` extra), `--lang fr`
speaks French, `--id` sets the device id (default: the host name), `--input-device` and
`--output-device` pick the sound card. The token is kept in `~/.config/nestor-satellite/<id>.json`
(mode 600), with the hashes of refused codes; later runs reconnect with it.
`nestor-satellite run --help` lists the rest.

## Going further

- The source, its tests and the voice clips' licence (CC BY 4.0):
  [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python).
- A complete driver built on it: [nestor-reachy](https://github.com/nestor-home/nestor-reachy).
- The messages and close codes: [Protocol](/docs/satellites/protocol/).
- Check yours: [Conformance](/docs/satellites/conformance/).
