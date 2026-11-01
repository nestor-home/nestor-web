---

title: SDK Python
description: Écrire un satellite en Python avec nestor-satellite, ou lancer sa commande sur toute machine qui a un micro et un haut-parleur.
---

[`nestor-satellite`](https://pypi.org/project/nestor-satellite/) s’occupe de l’appairage, du jeton,
du manifeste, du lien WebRTC et de l’audio. Il ne dépend pas du serveur Nestor. Python 3.12 ou plus
récent.

```bash
pip install 'nestor-satellite[sounddevice]'   # sounddevice: the machine's microphone and speaker
```

L’extra `qr` ajoute la lecture des QR codes (ZXing-C++), pour un appareil qui a une caméra.

## Un pilote minimal

Une enceinte avec un micro et une lumière, appairée la première fois, connectée ensuite :

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
    "http://nestor.local:7860",
    manifest,
    tokens=TokenStore("~/.config/nestor-satellite/enceinte-salon.json"),
    body=Led(),
    source=Microphone(),
    sink=Speaker(),
)
asyncio.run(satellite.run())  # pairs the first time, then stays connected and reconnects
```

Sans code d’enrôlement, il demande un code d’appareil et le dit sur son haut-parleur, chiffre par
chiffre, deux fois, avec des enregistrements livrés dans le paquet (hors ligne, en anglais ou en
français), et l’écrit dans son journal. Tapez-le dans l’administration. Avec `NESTOR_PAIRING_URI`,
il s’appaire aussitôt.

## Options d’appairage

Les méthodes d’appairage du manifeste découlent de ce que vous passez ; vous ne les listez jamais à
la main.

| Argument                                                                | Déclare                   |
| ----------------------------------------------------------------------- | ------------------------- |
| toujours                                                                | `enrollment.provisioning` |
| `display=` un `Display` (`show(text, code)`, `clear()`)                 | `device_code.display`     |
| `voice=` une fonction qui dit une phrase, ou un haut-parleur sans écran | `device_code.speech`      |
| `enrolls_by=[PairingMethod.INPUT]`                                      | `enrollment.input`        |
| `camera=AvCamera(…)`                                                    | `enrollment.qr`           |

- `enrollment=` prend une URI d’appairage ou un code d’enrôlement ; par défaut, il est lu dans
  `NESTOR_PAIRING_URI`, sinon `NESTOR_PAIRING_CODE`. Avec une URI d’appairage, l’adresse du cœur
  peut être `None`.
- Un code tapé sur l’appareil pendant qu’il attend : `await satellite.enroll("K7QF-2M9X")` rend
  `ACCEPTED`, `REFUSED` (plus jamais envoyé, même après un redémarrage), `NOT_PENDING` (le code
  d’appareil l’a emporté) ou `INVALID`.
- `locale="fr"` règle la langue dans laquelle il parle aux gens (par défaut, celle de
  l’environnement).
- Les échecs qu’attendre ne résout pas (un cœur qui parle une autre version du protocole, une
  requête qu’il rejette) arrêtent `run` avec `PairingFailed`, dit sur toutes les sorties. Un cœur
  injoignable est réessayé.
- `AvCamera("0", format="avfoundation")` lit la première caméra sous macOS,
  `AvCamera("/dev/video0", format="v4l2")` sous Linux (extra `qr`).

## La commande

Sans écrire une ligne : le micro et le haut-parleur de cette machine comme satellite.

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:7860/?code=K7QF2M9X' nestor-satellite run --room salon
# ou
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:7860/?code=K7QF2M9X'
# ou, avec l’adresse du cœur à part
nestor-satellite run --core http://nestor.local:7860 --room salon --pairing-code K7QF-2M9X
```

Sans code, `nestor-satellite run --core http://nestor.local:7860 --room salon` dit un code
d’appareil. `--camera 0` lit les QR codes (avec l’extra `qr`), `--lang fr` parle français, `--id`
fixe l’identifiant de l’appareil (par défaut, le nom de la machine). Le jeton est gardé dans
`~/.config/nestor-satellite/<id>.json` (mode 600), avec les empreintes des codes refusés ; les
lancements suivants se reconnectent avec. `nestor-satellite run --help` donne le reste.

## Pour aller plus loin

- Le code, ses tests et la licence des enregistrements de voix (CC BY 4.0) :
  [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python).
- Un pilote complet qui s’appuie dessus : [nestor-reachy](https://github.com/nestor-home/nestor-reachy).
- Vérifier le vôtre : [Conformité](/fr/docs/satellites/conformance/).
