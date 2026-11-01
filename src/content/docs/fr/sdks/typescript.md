---

title: SDK TypeScript
description: Écrire un satellite en TypeScript avec @nestor-home/satellite, dans un onglet de navigateur ou dans Node.
---

[`@nestor-home/satellite`](https://www.npmjs.com/package/@nestor-home/satellite) s’occupe de
l’appairage, du jeton, du manifeste, du lien WebRTC et de l’audio, dans les navigateurs et dans
Node 22 ou plus récent. Il ne dépend pas du serveur Nestor.

```bash
pnpm add @nestor-home/satellite
pnpm add @roamhq/wrtc   # dans Node seulement : WebRTC (libwebrtc, précompilé pour Linux, macOS et Windows x64)
```

## Un pilote minimal

Un onglet sur une tablette murale. Servi en `https:` ou sur `localhost`, depuis l’origine du serveur
ou à travers un proxy :

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

## Dans Node, sans écran

Le SDK dit alors le code d’appareil sur le haut-parleur, avec sa voix enregistrée (hors ligne, en
anglais ou en français), et l’écrit dans le journal, sauf si l’URI d’appairage est dans
l’environnement.

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

## Options d’appairage

Les méthodes d’appairage du manifeste découlent des options `pairing` ; vous ne les listez jamais à
la main.

| Option                                                                         | Déclare                                             |
| ------------------------------------------------------------------------------ | --------------------------------------------------- |
| toujours                                                                       | `enrollment.provisioning`                           |
| `display: (code, text) => …`                                                   | `device_code.display`                               |
| `speak: (sentence) => …`, ou un haut-parleur (`audio.playback`) sans `display` | `device_code.speech`                                |
| `voice: true`                                                                  | dit le code avec la voix livrée, même avec un écran |
| `accepts: ["enrollment.input"]`                                                | `enrollment.input`                                  |
| `scanner: cameraQrScanner({ wasmUrl })` (navigateurs)                          | `enrollment.qr`                                     |

- `enrollment` prend une URI d’appairage ou un code d’enrôlement.
- Un code tapé pendant que l’appareil attend : `await satellite.enroll(input.value)`. Un code
  refusé n’est plus jamais envoyé, même après un redémarrage : son SHA-256 est gardé dans le
  magasin de jetons, jamais le code.
- QR codes : `cameraQrScanner` vient de `@nestor-home/satellite/qr` et a besoin de `zxing-wasm`
  (environ 1 Mo de WebAssembly, chargé depuis jsDelivr sauf si `wasmUrl` dit où votre page le
  sert). Node n’a pas de caméra : un satellite Node ne déclare jamais `enrollment.qr`.
- `locale` règle la langue dans laquelle il parle aux gens (par défaut, celle de la plateforme).

## La commande

Dans Node, la commande fait du micro et du haut-parleur de cette machine un satellite (avec `rec`
et `play` de SoX par défaut) :

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' npx nestor-satellite run --room salon
# ou
npx nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
```

Lancez-la depuis un projet où les deux paquets sont installés. Avec un code seul, donnez le cœur
avec `--core` (`--pairing-code K7QF-2M9X`). Sans l’un ni l’autre, elle dit un code d’appareil à
taper dans Nestor (`--output none` : elle se contente de l’écrire dans le journal). `--input` et
`--output` prennent toute commande qui enregistre ou joue du PCM brut 48 kHz 16 bits mono, ou
`none`. Le jeton est gardé dans `~/.config/nestor-satellite/<id>.json` (mode 600).
`npx nestor-satellite --help` détaille les autres options.

## Pour aller plus loin

- Le code, un exemple pour navigateur et la licence des enregistrements de voix (CC BY 4.0) :
  [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript).
- Vérifier le vôtre : [Conformité](/fr/docs/satellites/conformance/).
