---

title: Python SDK
description: Write a satellite in Python with nestor-satellite, or run its command on any machine with a microphone and a speaker.
---

[`nestor-satellite`](https://pypi.org/project/nestor-satellite/) handles pairing, the token, the
manifest, the WebRTC link and audio. It does not depend on the Nestor server. Python 3.12 or later.

```bash
pip install 'nestor-satellite[sounddevice]'   # sounddevice: the machine's microphone and speaker
```

The `qr` extra adds QR code reading (ZXing-C++), for a device with a camera.

## A minimal driver

A speaker with a microphone and a light, paired the first time, connected from then on:

```python
import asyncio

from nestor_satellite import AUDIO_CAPTURE, AUDIO_PLAYBACK, EXPRESSION, IDENTIFY, Body, Device, Manifest
from nestor_satellite import Satellite, TokenStore
from nestor_satellite.devices import Microphone, Speaker


class Led(Body):
    def behavior(self, behavior):
        print("attitude:", behavior)  # idle, listening, thinking, speaking

    def expression(self, expression, intensity):
        print("expression:", expression, intensity)

    def identify(self):
        print("blink!")  # a person is telling devices apart


manifest = Manifest.of(
    Device("enceinte-salon", "raspberry-pi-4", "salon"), AUDIO_CAPTURE, AUDIO_PLAYBACK, EXPRESSION, IDENTIFY
)
satellite = Satellite(
    "http://nestor.local:8471",
    manifest,
    tokens=TokenStore("~/.config/nestor-satellite/enceinte-salon.json"),
    body=Led(),
    source=Microphone(),
    sink=Speaker(),
)
asyncio.run(satellite.run())  # pairs the first time, then stays connected and reconnects
```

With no enrollment code, it asks for a device code and says it on its speaker, digit by digit,
twice, with recorded clips shipped in the package (offline, English or French), and logs it. Type
it in the admin. With `NESTOR_PAIRING_URI` set, it pairs at once.

## Pairing options

The manifest’s pairing methods follow from what you pass; you never list them by hand.

| Argument                                                                 | Declares                  |
| ------------------------------------------------------------------------ | ------------------------- |
| always                                                                   | `enrollment.provisioning` |
| `display=` a `Display` (`show(text, code)`, `clear()`)                   | `device_code.display`     |
| `voice=` a function that says a sentence, or a speaker without a display | `device_code.speech`      |
| `enrolls_by=[PairingMethod.INPUT]`                                       | `enrollment.input`        |
| `camera=AvCamera(…)`                                                     | `enrollment.qr`           |

- `enrollment=` takes a pairing URI or an enrollment code; by default it is read from
  `NESTOR_PAIRING_URI`, else `NESTOR_PAIRING_CODE`. With a pairing URI, the core’s address may be
  `None`.
- A code typed on the device while it waits: `await satellite.enroll("K7QF-2M9X")` returns
  `ACCEPTED`, `REFUSED` (never sent again, even after a restart), `NOT_PENDING` (the device code
  won) or `INVALID`.
- `locale="fr"` sets the language it speaks to people (default: the environment’s).
- Failures that waiting cannot fix (a core speaking another protocol version, a request it
  rejects) stop `run` with `PairingFailed`, said on every output. A core that is down is retried.
- `AvCamera("0", format="avfoundation")` reads the first camera on macOS,
  `AvCamera("/dev/video0", format="v4l2")` on Linux (`qr` extra).

## The command

To use this machine’s microphone and speaker as a satellite without writing code:

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
# or
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# or, the core's address given apart
nestor-satellite run --core http://nestor.local:8471 --room salon --pairing-code K7QF-2M9X
```

Without a code, `nestor-satellite run --core http://nestor.local:8471 --room salon` says a device
code. `--camera 0` reads QR codes (with the `qr` extra), `--lang fr` speaks French, `--id` sets
the device id (default: the host name). The token is kept in
`~/.config/nestor-satellite/<id>.json` (mode 600), with the hashes of refused codes; later runs
reconnect with it. `nestor-satellite run --help` lists the rest.

## Going further

- The source, its tests and the voice clips' licence (CC BY 4.0):
  [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python).
- A complete driver built on it: [nestor-reachy](https://github.com/nestor-home/nestor-reachy).
- Check yours: [Conformance](/docs/satellites/conformance/).
