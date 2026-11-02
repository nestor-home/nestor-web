---

title: TypeScript SDK
description: Write a satellite in TypeScript with @nestor-home/satellite, in a browser tab or in Node, aloud or in writing.
---

[`@nestor-home/satellite`](https://www.npmjs.com/package/@nestor-home/satellite) handles pairing,
the token, the manifest, the WebSocket link and text, in browsers and in Node 22.12 or later. The
voice (WebRTC audio) is a separate entry point: `@nestor-home/satellite/voice` in browsers,
`@nestor-home/satellite/node` in Node. A device that only writes loads none of it. The SDK does not
depend on the Nestor server.

```bash
pnpm add @nestor-home/satellite
pnpm add @roamhq/wrtc   # in Node, to talk aloud: WebRTC (libwebrtc, prebuilt for Linux, macOS and Windows x64)
```

## A minimal driver

A tab on a wall tablet that writes with the assistant. Served over `https:` or `localhost`, from
the server’s origin or through a proxy:

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

To talk aloud too, give it a voice. The microphone opens only once Nestor allows audio, never while
pairing:

```ts
import { browserVoice } from "@nestor-home/satellite/voice";

const satellite = new Satellite({ ...options, voice: browserVoice() });
button.onclick = () => satellite.run(); // a click: browsers only play sound after a gesture
```

`browserVoice({ microphone: false })` has no microphone, `browserVoice({ element: null })` no
speaker; `iceServers` (STUN or TURN URLs) is only needed beyond the local network.

## In Node, headless

Without a screen, the SDK says the device code on the speaker with its recorded voice (offline,
English or French) and logs it, unless the pairing URI is in the environment.

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

The manifest lists the device and what its body and sensors do (`EXPRESSION`, `IDENTIFY`,
`HEAD_MOTION`, `PERSON_DETECTION`, `SPEECH_ACTIVITY`). The text and audio capabilities follow from
the `text` and `voice` options. Declaring one in the manifest without what carries it out throws a
`ProtocolError`.

| Option                                         | Declares         |
| ---------------------------------------------- | ---------------- |
| `text: { display: (text, final) => … }`        | `text.display`   |
| `text: { input: true }`                        | `text.input`     |
| a `voice` with a microphone (`source` in Node) | `audio.capture`  |
| a `voice` with a speaker (`sink` in Node)      | `audio.playback` |

- `satellite.sendText(text)` sends what a person typed, 1 to 4,000 characters. It returns `false`
  while the link is down (nothing is queued), and throws `CapabilityNotAllowed` when `text.input`
  was not given or the household did not allow it.
- An answer can come in several messages (the assistant says it is looking, then gives the result);
  `final` marks the last one of a turn. A typed turn is answered in writing when the device shows
  text, aloud otherwise.
- The voice offers WebRTC only once the core has allowed audio; until then, and on a device without
  a voice, everything goes through the link.
- `run` rejects with `LinkReplaced` when a newer link of the same device takes over (`4409`), and
  with `PairingError` when the core will never pair it. A refused token (`4401`) is forgotten and the
  device pairs again; any other close reconnects, waiting longer each time.

## Pairing options

The manifest’s pairing methods follow from the `pairing` options; you never list them by hand.

| Option                                                                 | Declares                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| always                                                                 | `enrollment.provisioning`                               |
| `display: (code, text) => …`                                           | `device_code.display`                                   |
| `speak: (sentence) => …`, or a `voice` with a speaker and no `display` | `device_code.speech`                                    |
| `voice: true`                                                          | says the code with the bundled voice even with a screen |
| `accepts: ["enrollment.input"]`                                        | `enrollment.input`                                      |
| `scanner: cameraQrScanner({ wasmUrl })` (browsers)                     | `enrollment.qr`                                         |

- `enrollment` takes a pairing URI or an enrollment code.
- A code typed while the device waits: `await satellite.enroll(input.value)`. A refused code is
  never sent again, even after a restart: its SHA-256 is kept in the token store, never the code.
- QR codes: `cameraQrScanner` comes from `@nestor-home/satellite/qr` and needs `zxing-wasm`
  (about 1 MB of WebAssembly, fetched from jsDelivr unless `wasmUrl` says where your page serves
  it). Node has no camera, so a Node satellite never declares `enrollment.qr`.
- `locale` sets the language it speaks to people (default: the platform’s).

## The command

In Node, to use this machine’s microphone and speaker as a satellite (`arecord` and `aplay` on
Linux, `rec` and `play` from SoX on macOS, by default):

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' npx nestor-satellite run --room salon
# or
npx nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# in writing only: lines typed on stdin are sent, the answers printed
npx nestor-satellite run --core http://nestor.local:8471 --room bureau --text --no-voice
```

Run it from a project where `@nestor-home/satellite` is installed, with `@roamhq/wrtc` to talk
aloud. `--text` adds writing to the voice, `--no-voice` drops the microphone and the speaker. With a
bare code, give the core with `--core` (`--pairing-code K7QF-2M9X`). Without either, it says a
device code to type in Nestor (`--output none`: it only logs it). `--input` and `--output` take any
command that records or plays raw 48 kHz 16-bit mono PCM, or `none`. The token is kept in
`~/.config/nestor-satellite/<id>.json` (mode 600). `npx nestor-satellite --help` lists the rest.

## Going further

- The source, a browser example and the voice clips' licence (CC BY 4.0):
  [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript).
- The messages and close codes: [Protocol](/docs/satellites/protocol/).
- Check yours: [Conformance](/docs/satellites/conformance/).
