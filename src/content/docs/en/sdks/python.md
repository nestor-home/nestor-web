---

title: Python SDK
description: Write a satellite in Python with nestor-satellite, or run its command on any machine, aloud or in writing.
---

[`nestor-satellite`](https://pypi.org/project/nestor-satellite/) handles pairing, the token, the
manifest, the link and text, on Python 3.12 or later. Audio is the `voice` extra; a device that
only writes skips it.

```bash
pip install 'nestor-satellite[voice,sounddevice]'   # voice: WebRTC audio; sounddevice: the machine's microphone and speaker
pip install nestor-satellite                        # a device that only writes
```

The `qr` extra reads QR codes from a camera.

## A minimal driver

A speaker with a microphone, a light and a text output:

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

Without an enrollment code, it says a device code on its speaker and logs it: type it in the admin.

## Text and audio

The manifest lists the body and sensors (`EXPRESSION`, `IDENTIFY`, `HEAD_MOTION`,
`PERSON_DETECTION`, `SPEECH_ACTIVITY`). Text and audio follow from the arguments; declaring them in
the manifest raises `ValueError`.

| Argument                                    | Declares         |
| ------------------------------------------- | ---------------- |
| `text_display=` a function `(text, final)`  | `text.display`   |
| `text_input=True`                           | `text.input`     |
| `source=` an `AudioSource` (`Microphone()`) | `audio.capture`  |
| `sink=` an `AudioSink` (`Speaker()`)        | `audio.playback` |

- `satellite.send_text("…")` sends 1 to 4,000 typed characters. It returns `False` while the link
  is down, and raises `CapabilityNotAllowed` if the household did not allow `text.input`.
- `final` marks the last message of an answer.
- `ice_servers=` (STUN or TURN URLs) is needed only beyond the local network.
- `run` returns when a newer link of the same device replaces this one. Otherwise it reconnects,
  or pairs again if its token is refused.

## Pairing options

Pairing methods follow from the arguments.

| Argument                                                                  | Declares                  |
| ------------------------------------------------------------------------- | ------------------------- |
| always                                                                    | `enrollment.provisioning` |
| `display=` a `Display` (`show(text, code)`, `clear()`)                    | `device_code.display`     |
| `voice=` a function that says a sentence, or a `sink` without a `display` | `device_code.speech`      |
| `enrolls_by=[PairingMethod.INPUT]`                                        | `enrollment.input`        |
| `camera=AvCamera(…)`                                                      | `enrollment.qr`           |

- `enrollment=` takes a pairing URI or an enrollment code. The default reads `NESTOR_PAIRING_URI`,
  then `NESTOR_PAIRING_CODE`.
- `await satellite.enroll("K7QF-2M9X")` sends a code typed on the device. It returns `ACCEPTED`,
  `REFUSED`, `NOT_PENDING` or `INVALID`. A refused code is never sent again.
- `locale="fr"` sets the language it speaks.
- `run` raises `PairingFailed` when retrying cannot help, such as a core on another protocol
  version.

## The command

`nestor-satellite run` turns this machine into a satellite (`voice` and `sounddevice` extras):

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
# or
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# or, the core's address given apart
nestor-satellite run --core http://nestor.local:8471 --room salon --pairing-code K7QF-2M9X
# in writing only: lines typed on stdin are sent, the answers printed (no extra needed)
nestor-satellite run --core http://nestor.local:8471 --room bureau --text --no-voice
```

- `--no-voice` drops the microphone and the speaker; `--text` adds writing.
- Without a code, it says a device code.
- `--lang fr` speaks French. `--camera 0` reads QR codes (`qr` extra).

The token is kept in `~/.config/nestor-satellite/<id>.json`. `nestor-satellite run --help` lists
the rest.

## Software and updates

The manifest names the software the device runs: `nestor-satellite` and its version, unless the
driver's manifest passes `software=Software.of("my-satellite")`, the package it is published as
(its version is read from the installed metadata).

`updater=` an `Updater` lets the household update the device from the admin, and declares
`device.update`. An `Updater` says which newer version its source has (`newer`) and installs one
(`install`), and may give the address of that version's release notes (`notes`). The SDK ships
`PypiUpdater` for packages installed from PyPI with uv or pip: its notes are the project's changelog
or releases link, else the version's page on PyPI. Without an updater, the admin only shows the
version.

`nestor-satellite run --managed` uses it on itself. When a person asks for the update, the command
installs the new version in its own environment, then starts its own command line again in place.
If the new version is not welcomed within 60 s, it installs the previous one again and reports the
failure. Run it under a service manager all the same.

## Going further

- The source and the voice clips' licence:
  [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python).
- A complete driver: [nestor-reachy](https://github.com/nestor-home/nestor-reachy).
- Messages and close codes: [Protocol](/docs/satellites/protocol/).
- Check yours: [Conformance](/docs/satellites/conformance/).
