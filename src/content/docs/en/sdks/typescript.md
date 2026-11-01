---

title: TypeScript SDK
description: Write a satellite in TypeScript with @nestor-home/satellite, in a browser tab or in Node.
---

[`@nestor-home/satellite`](https://www.npmjs.com/package/@nestor-home/satellite) handles pairing,
the token, the manifest, the WebRTC link and audio, in browsers and in Node 22 or later. It does not
depend on the Nestor server.

```bash
pnpm add @nestor-home/satellite
pnpm add @roamhq/wrtc   # in Node only: WebRTC (libwebrtc, prebuilt for Linux, macOS and Windows x64)
```

## A minimal driver

A tab on a wall tablet. Served over `https:` or `localhost`, from the server’s origin or through a
proxy:

```ts
import {
  AUDIO_CAPTURE,
  AUDIO_PLAYBACK,
  browserWebRtc,
  IDENTIFY,
  LocalStorageTokenStore,
  Manifest,
  Satellite,
} from "@nestor-home/satellite";

const satellite = new Satellite({
  core: location.origin,
  manifest: Manifest.of(
    { id: "tablette-cuisine", model: "browser", room: "cuisine" },
    AUDIO_CAPTURE,
    AUDIO_PLAYBACK,
    IDENTIFY,
  ),
  tokens: new LocalStorageTokenStore(),
  webrtc: browserWebRtc(),
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
button.onclick = () => satellite.run(); // a click: browsers only play sound after a gesture
```

## In Node, headless

Without a screen, the SDK says the device code on the speaker with its recorded voice (offline,
English or French) and logs it, unless the pairing URI is in the environment.

```ts
import { AUDIO_CAPTURE, AUDIO_PLAYBACK, EXPRESSION, Manifest, Satellite } from "@nestor-home/satellite";
import {
  CommandSink,
  CommandSource,
  FileTokenStore,
  languagesFromEnv,
  nodeWebRtc,
  provisioningFromEnv,
} from "@nestor-home/satellite/node";

const provisioning = provisioningFromEnv(); // NESTOR_PAIRING_URI or NESTOR_PAIRING_CODE, if set
const satellite = new Satellite({
  core: provisioning?.core ?? "http://nestor.local:8471",
  manifest: Manifest.of(
    { id: "enceinte-salon", model: "raspberry-pi-4", room: "salon" },
    AUDIO_CAPTURE,
    AUDIO_PLAYBACK,
    EXPRESSION,
  ),
  tokens: new FileTokenStore("~/.config/nestor-satellite/enceinte-salon.json"), // mode 600
  webrtc: nodeWebRtc({
    source: new CommandSource("arecord -q -t raw -f S16_LE -c 1 -r 48000"),
    sink: new CommandSink("aplay -q -t raw -f S16_LE -c 1 -r 48000"),
  }),
  pairing: { enrollment: provisioning?.enrollment },
  locale: languagesFromEnv(), // LC_ALL, LC_MESSAGES, LANG
  body: { expression: (expression) => console.log("expression:", expression) },
});
const stop = new AbortController();
process.once("SIGINT", () => stop.abort());
await satellite.run(stop.signal); // pairs the first time, then reconnects forever
```

## Pairing options

The manifest’s pairing methods follow from the `pairing` options; you never list them by hand.

| Option                                                                      | Declares                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------- |
| always                                                                      | `enrollment.provisioning`                               |
| `display: (code, text) => …`                                                | `device_code.display`                                   |
| `speak: (sentence) => …`, or a speaker (`audio.playback`) without `display` | `device_code.speech`                                    |
| `voice: true`                                                               | says the code with the bundled voice even with a screen |
| `accepts: ["enrollment.input"]`                                             | `enrollment.input`                                      |
| `scanner: cameraQrScanner({ wasmUrl })` (browsers)                          | `enrollment.qr`                                         |

- `enrollment` takes a pairing URI or an enrollment code.
- A code typed while the device waits: `await satellite.enroll(input.value)`. A refused code is
  never sent again, even after a restart: its SHA-256 is kept in the token store, never the code.
- QR codes: `cameraQrScanner` comes from `@nestor-home/satellite/qr` and needs `zxing-wasm`
  (about 1 MB of WebAssembly, fetched from jsDelivr unless `wasmUrl` says where your page serves
  it). Node has no camera, so a Node satellite never declares `enrollment.qr`.
- `locale` sets the language it speaks to people (default: the platform’s).

## The command

In Node, to use this machine’s microphone and speaker as a satellite (with `rec` and `play` from
SoX by default):

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' npx nestor-satellite run --room salon
# or
npx nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
```

Run it from a project where both packages are installed. With a bare code, give the core with
`--core` (`--pairing-code K7QF-2M9X`). Without either, it says a device code to type in Nestor
(`--output none`: it only logs it). `--input` and `--output` take any command that records or plays
raw 48 kHz 16-bit mono PCM, or `none`. The token is kept in `~/.config/nestor-satellite/<id>.json`
(mode 600). `npx nestor-satellite --help` lists the rest.

## Going further

- The source, a browser example and the voice clips' licence (CC BY 4.0):
  [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript).
- Check yours: [Conformance](/docs/satellites/conformance/).
