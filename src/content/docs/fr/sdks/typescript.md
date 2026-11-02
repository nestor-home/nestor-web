---

title: SDK TypeScript
description: Écrire un satellite en TypeScript avec @nestor-home/satellite, dans un onglet de navigateur ou dans Node, à voix haute ou par écrit.
---

[`@nestor-home/satellite`](https://www.npmjs.com/package/@nestor-home/satellite) s’occupe de
l’appairage, du jeton, du manifeste, du lien WebSocket et du texte, dans les navigateurs et dans
Node 22.12 ou plus récent. La voix (l’audio en WebRTC) a son propre point d’entrée :
`@nestor-home/satellite/voice` dans les navigateurs, `@nestor-home/satellite/node` dans Node. Un
appareil qui ne fait qu’écrire n’en charge rien. Le SDK ne dépend pas du serveur Nestor.

```bash
pnpm add @nestor-home/satellite
pnpm add @roamhq/wrtc   # dans Node, pour parler : WebRTC (libwebrtc, précompilé pour Linux, macOS et Windows x64)
```

## Un pilote minimal

Un onglet sur une tablette murale, qui écrit avec l’assistant. Servi en `https:` ou sur
`localhost`, depuis l’origine du serveur ou à travers un proxy :

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

Pour qu’il parle aussi, donnez-lui une voix. Le micro ne s’ouvre qu’une fois l’audio autorisé par
Nestor, jamais pendant l’appairage :

```ts
import { browserVoice } from "@nestor-home/satellite/voice";

const satellite = new Satellite({ ...options, voice: browserVoice() });
button.onclick = () => satellite.run(); // a click: browsers only play sound after a gesture
```

`browserVoice({ microphone: false })` n’a pas de micro, `browserVoice({ element: null })` pas de
haut-parleur ; `iceServers` (des URL STUN ou TURN) ne sert qu’au-delà du réseau local.

## Dans Node, sans écran

Le SDK dit alors le code d’appareil sur le haut-parleur, avec sa voix enregistrée (hors ligne, en
anglais ou en français), et l’écrit dans le journal, sauf si l’URI d’appairage est dans
l’environnement.

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

Le manifeste décrit l’appareil et ce que font son corps et ses capteurs (`EXPRESSION`, `IDENTIFY`,
`HEAD_MOTION`, `PERSON_DETECTION`, `SPEECH_ACTIVITY`). Les capacités de texte et d’audio découlent
des options `text` et `voice`. En déclarer une dans le manifeste sans ce qui la réalise lève une
`ProtocolError`.

| Option                                              | Déclare          |
| --------------------------------------------------- | ---------------- |
| `text: { display: (text, final) => … }`             | `text.display`   |
| `text: { input: true }`                             | `text.input`     |
| une `voice` avec un micro (`source` dans Node)      | `audio.capture`  |
| une `voice` avec un haut-parleur (`sink` dans Node) | `audio.playback` |

- `satellite.sendText(text)` envoie ce qu’une personne a tapé, de 1 à 4 000 caractères. Il
  renvoie `false` quand le lien est coupé (rien n’est mis en attente) et lève `CapabilityNotAllowed`
  si `text.input` n’a pas été donné ou si le foyer ne l’a pas autorisé.
- Une réponse peut arriver en plusieurs messages (l’assistant dit qu’il cherche, puis donne le
  résultat) ; `final` marque le dernier d’un tour. Un tour tapé reçoit une réponse écrite si
  l’appareil affiche du texte, à voix haute sinon.
- La voix ne propose WebRTC qu’une fois l’audio autorisé par le cœur ; d’ici là, et sur un
  appareil sans voix, tout passe par le lien.
- `run` échoue avec `LinkReplaced` quand un lien plus récent du même appareil prend le relais
  (`4409`), et avec `PairingError` quand le cœur ne l’appairera jamais. Un jeton refusé (`4401`) est
  oublié et l’appareil s’appaire de nouveau ; toute autre fermeture mène à une reconnexion, avec
  une attente qui s’allonge.

## Options d’appairage

Les méthodes d’appairage du manifeste découlent des options `pairing` ; vous ne les listez
jamais à la main.

| Option                                                                       | Déclare                                             |
| ---------------------------------------------------------------------------- | --------------------------------------------------- |
| toujours                                                                     | `enrollment.provisioning`                           |
| `display: (code, text) => …`                                                 | `device_code.display`                               |
| `speak: (sentence) => …`, ou une `voice` avec un haut-parleur sans `display` | `device_code.speech`                                |
| `voice: true`                                                                | dit le code avec la voix livrée, même avec un écran |
| `accepts: ["enrollment.input"]`                                              | `enrollment.input`                                  |
| `scanner: cameraQrScanner({ wasmUrl })` (navigateurs)                        | `enrollment.qr`                                     |

- `enrollment` prend une URI d’appairage ou un code d’enrôlement.
- Un code tapé pendant que l’appareil attend : `await satellite.enroll(input.value)`. Un code
  refusé n’est plus jamais envoyé, même après un redémarrage : son SHA-256 est gardé dans le
  magasin de jetons, jamais le code.
- QR codes : `cameraQrScanner` vient de `@nestor-home/satellite/qr` et a besoin de `zxing-wasm`
  (environ 1 Mo de WebAssembly, chargé depuis jsDelivr sauf si `wasmUrl` dit où votre page le
  sert). Node n’a pas de caméra : un satellite Node ne déclare jamais `enrollment.qr`.
- `locale` règle la langue dans laquelle il parle aux gens (par défaut, celle de la plateforme).

## La commande

Dans Node, la commande fait du micro et du haut-parleur de cette machine un satellite (par défaut,
`arecord` et `aplay` sous Linux, `rec` et `play` de SoX sous macOS) :

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' npx nestor-satellite run --room salon
# ou
npx nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# par écrit seulement : les lignes tapées sont envoyées, les réponses affichées
npx nestor-satellite run --core http://nestor.local:8471 --room bureau --text --no-voice
```

Lancez-la depuis un projet où `@nestor-home/satellite` est installé, avec `@roamhq/wrtc` pour
parler. `--text` ajoute l’écrit à la voix, `--no-voice` retire le micro et le haut-parleur. Avec un
code seul, donnez le cœur avec `--core` (`--pairing-code K7QF-2M9X`). Sans l’un ni l’autre, elle
dit un code d’appareil à taper dans Nestor (`--output none` : elle se contente de l’écrire dans
le journal). `--input` et `--output` prennent toute commande qui enregistre ou joue du PCM brut
48 kHz 16 bits mono, ou `none`. Le jeton est gardé dans `~/.config/nestor-satellite/<id>.json`
(mode 600). `npx nestor-satellite --help` détaille les autres options.

## Pour aller plus loin

- Le code, un exemple pour navigateur et la licence des enregistrements de voix (CC BY 4.0) :
  [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript).
- Les messages et les codes de fermeture : [Protocole](/fr/docs/satellites/protocol/).
- Vérifier le vôtre : [Conformité](/fr/docs/satellites/conformance/).
