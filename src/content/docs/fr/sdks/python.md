---

title: SDK Python
description: Écrire un satellite en Python avec nestor-satellite, ou lancer sa commande sur n’importe quelle machine, à voix haute ou par écrit.
---

[`nestor-satellite`](https://pypi.org/project/nestor-satellite/) s’occupe de l’appairage, du jeton,
du manifeste, du lien WebSocket et du texte. L’audio en WebRTC est l’extra `voice` : un
appareil qui ne fait qu’écrire n’en installe rien. Le paquet ne dépend pas du serveur Nestor. Python
3.12 ou plus récent.

```bash
pip install 'nestor-satellite[voice,sounddevice]'   # voice: WebRTC audio; sounddevice: the machine's microphone and speaker
pip install nestor-satellite                        # a device that only writes
```

L’extra `qr` ajoute la lecture des QR codes (ZXing-C++), pour un appareil qui a une caméra.

## Un pilote minimal

Une enceinte avec un micro, une lumière et une sortie texte, appairée la première fois, connectée
ensuite :

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

Sans code d’enrôlement, il demande un code d’appareil et le dit sur son haut-parleur, chiffre par
chiffre, deux fois, avec des enregistrements livrés dans le paquet (hors ligne, en anglais ou en
français), et l’écrit dans son journal. Tapez-le dans l’administration. Avec `NESTOR_PAIRING_URI`,
il s’appaire aussitôt.

## Texte et audio

Le manifeste décrit l’appareil et ce que font son corps et ses capteurs (`EXPRESSION`, `IDENTIFY`,
`HEAD_MOTION`, `PERSON_DETECTION`, `SPEECH_ACTIVITY`). Les capacités de texte et d’audio découlent
de ce que vous donnez au satellite. En déclarer une dans le manifeste lève `ValueError`.

| Argument                                     | Déclare          |
| -------------------------------------------- | ---------------- |
| `text_display=` une fonction `(text, final)` | `text.display`   |
| `text_input=True`                            | `text.input`     |
| `source=` un `AudioSource` (`Microphone()`)  | `audio.capture`  |
| `sink=` un `AudioSink` (`Speaker()`)         | `audio.playback` |

- `satellite.send_text("…")` envoie ce qu’une personne a tapé, de 1 à 4 000 caractères,
  comme un tour de la conversation de la pièce. Il renvoie `False` quand le lien est coupé (rien
  n’est mis en attente) et lève `CapabilityNotAllowed` si `text_input` n’a pas été donné ou si le
  foyer ne l’a pas autorisé.
- Une réponse peut arriver en plusieurs messages (l’assistant dit qu’il cherche, puis donne le
  résultat) ; `final` marque le dernier d’un tour. Un tour tapé reçoit une réponse écrite si
  l’appareil affiche du texte, à voix haute sinon.
- `source` et `sink` demandent l’extra `voice`. Le satellite ne propose WebRTC qu’une fois l’audio
  autorisé par le cœur ; d’ici là, et sur un appareil sans audio, tout passe par le lien.
  `ice_servers=` (des URL STUN ou TURN) ne sert qu’au-delà du réseau local.
- Quand un lien plus récent du même appareil le remplace (`4409`), `run` s’arrête. Un jeton refusé
  (`4401`) est oublié et l’appareil s’appaire de nouveau ; toute autre fermeture mène à une
  reconnexion, avec une attente qui s’allonge.

## Options d’appairage

Les méthodes d’appairage du manifeste découlent de ce que vous passez ; vous ne les listez
jamais à la main.

| Argument                                                              | Déclare                   |
| --------------------------------------------------------------------- | ------------------------- |
| toujours                                                              | `enrollment.provisioning` |
| `display=` un `Display` (`show(text, code)`, `clear()`)               | `device_code.display`     |
| `voice=` une fonction qui dit une phrase, ou un `sink` sans `display` | `device_code.speech`      |
| `enrolls_by=[PairingMethod.INPUT]`                                    | `enrollment.input`        |
| `camera=AvCamera(…)`                                                  | `enrollment.qr`           |

- `enrollment=` prend une URI d’appairage ou un code d’enrôlement ; par défaut, il est lu dans
  `NESTOR_PAIRING_URI`, sinon `NESTOR_PAIRING_CODE`. Avec une URI d’appairage, l’adresse du cœur
  peut être `None`.
- Un appareil sans écran ni haut-parleur se contente d’écrire son code d’appareil dans le journal.
- Un code tapé sur l’appareil pendant qu’il attend : `await satellite.enroll("K7QF-2M9X")` renvoie
  `ACCEPTED`, `REFUSED` (plus jamais envoyé, même après un redémarrage), `NOT_PENDING` (le code
  d’appareil l’a emporté) ou `INVALID`.
- `locale="fr"` règle la langue dans laquelle il parle aux gens (par défaut, celle de
  l’environnement).
- Les échecs que l’attente ne réglera pas (un cœur qui parle une autre version du protocole, une
  requête qu’il rejette) arrêtent `run` avec `PairingFailed`, annoncé sur toutes les sorties. Si le
  cœur est injoignable, il réessaie.
- `AvCamera("0", format="avfoundation")` lit la première caméra sous macOS,
  `AvCamera("/dev/video0", format="v4l2")` sous Linux (extra `qr`).

## La commande

Sans écrire une ligne de code, la commande fait du micro et du haut-parleur de cette machine un
satellite (avec les extras `voice` et `sounddevice`) :

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
# ou
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# ou, avec l’adresse du cœur à part
nestor-satellite run --core http://nestor.local:8471 --room salon --pairing-code K7QF-2M9X
# par écrit seulement : les lignes tapées sont envoyées, les réponses affichées (sans extra)
nestor-satellite run --core http://nestor.local:8471 --room bureau --text --no-voice
```

`--text` ajoute l’écrit à la voix, `--no-voice` retire le micro et le haut-parleur. Sans code,
`nestor-satellite run --core http://nestor.local:8471 --room salon` dit un code d’appareil (avec
`--no-voice`, il l’écrit seulement dans le journal). `--camera 0` lit les QR codes (avec l’extra
`qr`), `--lang fr` parle français, `--id` fixe l’identifiant de l’appareil (par défaut, le nom de la
machine), `--input-device` et `--output-device` choisissent la carte son. Le jeton est gardé dans
`~/.config/nestor-satellite/<id>.json` (mode 600), avec les empreintes des codes refusés ; les
lancements suivants se reconnectent avec. `nestor-satellite run --help` détaille les autres options.

## Pour aller plus loin

- Le code, ses tests et la licence des enregistrements de voix (CC BY 4.0) :
  [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python).
- Un pilote complet qui s’appuie dessus : [nestor-reachy](https://github.com/nestor-home/nestor-reachy).
- Les messages et les codes de fermeture : [Protocole](/fr/docs/satellites/protocol/).
- Vérifier le vôtre : [Conformité](/fr/docs/satellites/conformance/).
