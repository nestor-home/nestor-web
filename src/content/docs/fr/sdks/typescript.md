---

title: SDK TypeScript
description: Écrire un satellite en TypeScript avec @nestor-home/satellite, dans un onglet de navigateur ou dans Node, à voix haute ou par écrit.
---

[`@nestor-home/satellite`](https://www.npmjs.com/package/@nestor-home/satellite) gère
l’appairage, le jeton, le manifeste, le lien et le texte, dans les navigateurs et Node 22.12 ou plus
récent. L’audio a son propre point d’entrée (`/voice` dans les navigateurs, `/node` dans Node) ; un
appareil qui ne fait qu’écrire s’en passe.

```bash
pnpm add @nestor-home/satellite
pnpm add @roamhq/wrtc   # dans Node, pour parler : WebRTC (libwebrtc, précompilé pour Linux, macOS et Windows x64)
```

## Un pilote minimal

Un onglet sur une tablette murale, qui écrit avec l’assistant, servi en `https:` ou sur
`localhost` :

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

Pour qu’il parle aussi, donnez-lui une voix. Le micro s’ouvre une fois l’audio autorisé par Nestor :

```ts
import { browserVoice } from "@nestor-home/satellite/voice";

const satellite = new Satellite({ ...options, voice: browserVoice() });
button.onclick = () => satellite.run(); // a click: browsers only play sound after a gesture
```

`browserVoice({ microphone: false })` n’a pas de micro, `browserVoice({ element: null })` pas de
haut-parleur.

## Dans Node, sans écran

Sans écran ni URI d’appairage, il dit un code d’appareil sur son haut-parleur et l’écrit dans le
journal :

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

## Texte et audio

Le manifeste décrit le corps et les capteurs (`EXPRESSION`, `IDENTIFY`, `HEAD_MOTION`,
`PERSON_DETECTION`, `SPEECH_ACTIVITY`). Le texte et l’audio découlent des options `text` et
`voice` ; les déclarer dans le manifeste sans elles lève une `ProtocolError`.

| Option                                              | Déclare          |
| --------------------------------------------------- | ---------------- |
| `text: { display: (text, final) => … }`             | `text.display`   |
| `text: { input: true }`                             | `text.input`     |
| une `voice` avec un micro (`source` dans Node)      | `audio.capture`  |
| une `voice` avec un haut-parleur (`sink` dans Node) | `audio.playback` |

- `satellite.sendText(text)` envoie de 1 à 4 000 caractères tapés. Il renvoie `false` quand le
  lien est coupé et lève `CapabilityNotAllowed` si le foyer n’a pas autorisé `text.input`.
- `final` marque le dernier message d’une réponse.
- L’option `iceServers` de `browserVoice` ou de `nodeVoice` (des URL STUN ou TURN) ne sert
  qu’au-delà du réseau local.
- `run` échoue avec `LinkReplaced` quand un lien plus récent du même appareil prend le relais, et
  avec `PairingError` quand le cœur ne l’appairera jamais. Sinon, il se reconnecte, ou s’appaire de
  nouveau si son jeton est refusé.

## Options d’appairage

Les méthodes d’appairage découlent des options `pairing`.

| Option                                                                       | Déclare                                             |
| ---------------------------------------------------------------------------- | --------------------------------------------------- |
| toujours                                                                     | `enrollment.provisioning`                           |
| `display: (code, text) => …`                                                 | `device_code.display`                               |
| `speak: (sentence) => …`, ou une `voice` avec un haut-parleur sans `display` | `device_code.speech`                                |
| `voice: true`                                                                | dit le code avec la voix livrée, même avec un écran |
| `accepts: ["enrollment.input"]`                                              | `enrollment.input`                                  |
| `scanner: cameraQrScanner({ wasmUrl })` (navigateurs)                        | `enrollment.qr`                                     |

- `enrollment` prend une URI d’appairage ou un code d’enrôlement.
- `await satellite.enroll(input.value)` envoie un code tapé sur l’appareil. Un code refusé n’est
  plus jamais envoyé.
- `cameraQrScanner` vient de `@nestor-home/satellite/qr` et demande `zxing-wasm`. Node n’a pas de
  caméra.
- `locale` règle la langue dans laquelle il parle.

## La commande

Dans Node, `npx nestor-satellite run` fait de cette machine un satellite. Lancez-la depuis un
projet où le SDK est installé, avec `@roamhq/wrtc` pour parler :

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' npx nestor-satellite run --room salon
# ou
npx nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# par écrit seulement : les lignes tapées sont envoyées, les réponses affichées
npx nestor-satellite run --core http://nestor.local:8471 --room bureau --text --no-voice
```

- `--no-voice` retire le micro et le haut-parleur ; `--text` ajoute l’écrit.
- Sans code, elle dit un code d’appareil. Un code seul demande `--core` et `--pairing-code`.
- `--input` et `--output` prennent une commande qui enregistre ou joue du PCM brut 48 kHz 16 bits
  mono, ou `none`. Par défaut : `arecord` et `aplay` sous Linux, SoX sous macOS.

Le jeton est gardé dans `~/.config/nestor-satellite/<id>.json`. `npx nestor-satellite --help`
détaille le reste.

## Logiciel et mises à jour

Le manifeste nomme le logiciel que fait tourner l’appareil : `@nestor-home/satellite` et sa
version, sauf si l’option `software` du manifeste (`new Manifest(device, capabilities, { software })`)
nomme le paquet sous lequel un pilote est publié. Un onglet de navigateur reçoit le nouveau code en
se rechargeant : il ne déclare pas de mise à jour. Ailleurs, un `updater` facultatif déclare
`device.update` ; le SDK n’en fournit aucun. Un `Updater` trouve une version plus récente à sa
source (`newer`), l’installe (`install`) et relance l’appareil dessus (`restart`) ; revenir à la
version précédente quand la nouvelle n’est pas accueillie dans les 60 s lui revient aussi. Le SDK
suit les [règles de mise à jour](/fr/docs/satellites/protocol/#10-mises-à-jour) du protocole.

## Pour aller plus loin

- Le code, un exemple pour navigateur et la licence des enregistrements de voix :
  [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript).
- Les messages et les codes de fermeture : [Protocole](/fr/docs/satellites/protocol/).
- Vérifier le vôtre : [Conformité](/fr/docs/satellites/conformance/).
