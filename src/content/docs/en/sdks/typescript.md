---

title: TypeScript SDK
description: Write a satellite in TypeScript with @nestor-home/satellite, in a browser tab or in Node, aloud or in writing.
---

[`@nestor-home/satellite`](https://www.npmjs.com/package/@nestor-home/satellite) handles pairing,
the token, the manifest, the link and text, in browsers and Node 22.12 or later. Audio is a
separate entry point (`/voice` in browsers, `/node` in Node); a device that only writes skips it.

```bash
pnpm add @nestor-home/satellite
pnpm add @roamhq/wrtc   # in Node, to talk aloud: WebRTC (libwebrtc, prebuilt for Linux, macOS and Windows x64)
```

## A minimal driver

A wall tablet tab that writes with the assistant, served over `https:` or `localhost`:

```ts
import { IDENTIFY, LocalStorageTokenStore, Manifest, Satellite } from "@nestor-home/satellite";

const satellite = new Satellite({
  core: location.origin,
  manifest: Manifest.of({ id: "tablette-cuisine", model: "browser", room: "cuisine" }, IDENTIFY),
  tokens: new LocalStorageTokenStore(),
  // declares text.display and text.input
  text: { display: (text, final) => show(text, final), input: true },
  pairing: {
    // the device code to type in Nestor; `code` is null once it is no longer needed
    display: (code, text) => {
      document.querySelector("#code")!.textContent = code ?? "";
      document.querySelector("#status")!.textContent = text;
    },
  },
  body: {
    behavior: (behavior) => (document.body.dataset.behavior = behavior),
    identify: () => document.body.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 500, iterations: 6 }),
  },
});
satellite.run();
form.onsubmit = () => satellite.sendText(input.value); // a turn of the kitchen's conversation
```

To talk aloud too, give it a voice. The microphone opens once Nestor allows audio:

```ts
import { browserVoice } from "@nestor-home/satellite/voice";

const satellite = new Satellite({ ...options, voice: browserVoice() });
button.onclick = () => satellite.run(); // a click: browsers only play sound after a gesture
```

`browserVoice({ microphone: false })` has no microphone, `browserVoice({ element: null })` no
speaker.

## In Node, headless

Without a screen or a pairing URI, it says a device code on its speaker and logs it:

```ts
import { EXPRESSION, Manifest, Satellite } from "@nestor-home/satellite";
import {
  CommandSink,
  CommandSource,
  FileTokenStore,
  languagesFromEnv,
  nodeVoice,
  provisioningFromEnv,
} from "@nestor-home/satellite/node";

const provisioning = provisioningFromEnv(); // NESTOR_PAIRING_URI or NESTOR_PAIRING_CODE, if set
const satellite = new Satellite({
  core: provisioning?.core ?? "http://nestor.local:8471",
  manifest: Manifest.of({ id: "enceinte-salon", model: "raspberry-pi-4", room: "salon" }, EXPRESSION),
  tokens: new FileTokenStore("~/.config/nestor-satellite/enceinte-salon.json"), // mode 600
  voice: nodeVoice({
    source: new CommandSource("arecord -q -t raw -f S16_LE -c 1 -r 48000"), // audio.capture
    sink: new CommandSink("aplay -q -t raw -f S16_LE -c 1 -r 48000"), // audio.playback
  }),
  pairing: { enrollment: provisioning?.enrollment },
  locale: languagesFromEnv(), // LC_ALL, LC_MESSAGES, LANG
  body: { expression: (expression) => console.log("expression:", expression) },
});
const stop = new AbortController();
process.once("SIGINT", () => stop.abort());
await satellite.run(stop.signal); // pairs the first time, then reconnects until stopped
```

## Text and audio

The manifest lists the body and sensors (`EXPRESSION`, `IDENTIFY`, `HEAD_MOTION`,
`PERSON_DETECTION`, `SPEECH_ACTIVITY`). Text and audio follow from the `text` and `voice` options;
declaring them in the manifest without those throws a `ProtocolError`.

| Option                                         | Declares         |
| ---------------------------------------------- | ---------------- |
| `text: { display: (text, final) => … }`        | `text.display`   |
| `text: { input: true }`                        | `text.input`     |
| a `voice` with a microphone (`source` in Node) | `audio.capture`  |
| a `voice` with a speaker (`sink` in Node)      | `audio.playback` |

- `satellite.sendText(text)` sends 1 to 4,000 typed characters. It returns `false` while the link
  is down, and throws `CapabilityNotAllowed` if the household did not allow `text.input`.
- `final` marks the last message of an answer.
- `iceServers` (STUN or TURN URLs) is needed only beyond the local network.
- `run` rejects with `LinkReplaced` when a newer link of the same device takes over, and with
  `PairingError` when the core will never pair it. Otherwise it reconnects, or pairs again if its
  token is refused.

## Pairing options

Pairing methods follow from the `pairing` options.

| Option                                                                 | Declares                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| always                                                                 | `enrollment.provisioning`                               |
| `display: (code, text) => …`                                           | `device_code.display`                                   |
| `speak: (sentence) => …`, or a `voice` with a speaker and no `display` | `device_code.speech`                                    |
| `voice: true`                                                          | says the code with the bundled voice even with a screen |
| `accepts: ["enrollment.input"]`                                        | `enrollment.input`                                      |
| `scanner: cameraQrScanner({ wasmUrl })` (browsers)                     | `enrollment.qr`                                         |

- `enrollment` takes a pairing URI or an enrollment code.
- `await satellite.enroll(input.value)` sends a code typed on the device. A refused code is never
  sent again.
- `cameraQrScanner` comes from `@nestor-home/satellite/qr` and needs `zxing-wasm`. Node has no
  camera.
- `locale` sets the language it speaks.

## The command

In Node, `npx nestor-satellite run` turns this machine into a satellite. Run it from a project
where the SDK is installed, with `@roamhq/wrtc` to talk aloud:

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' npx nestor-satellite run --room salon
# or
npx nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# in writing only: lines typed on stdin are sent, the answers printed
npx nestor-satellite run --core http://nestor.local:8471 --room bureau --text --no-voice
```

- `--no-voice` drops the microphone and the speaker; `--text` adds writing.
- Without a code, it says a device code. A bare code needs `--core` and `--pairing-code`.
- `--input` and `--output` take a command that records or plays raw 48 kHz 16-bit mono PCM, or
  `none`. The defaults are `arecord` and `aplay` on Linux, SoX on macOS.

The token is kept in `~/.config/nestor-satellite/<id>.json`. `npx nestor-satellite --help` lists
the rest.

## Software and updates

The manifest names the software the device runs: `@nestor-home/satellite` and its version, unless
the `software` option names the package a driver is published as. A browser tab gets new code by
reloading, so it declares no update. Elsewhere, an optional `updater` (an `Updater`: `newer` finds a
newer version at its source, `install` installs it) declares `device.update` and follows the
protocol’s [update rules](/docs/satellites/protocol/#10-updates).

## Going further

- The source, a browser example and the voice clips' licence:
  [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript).
- Messages and close codes: [Protocol](/docs/satellites/protocol/).
- Check yours: [Conformance](/docs/satellites/conformance/).
