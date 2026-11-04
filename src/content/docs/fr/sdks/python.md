---

title: SDK Python
description: Écrire un satellite en Python avec nestor-satellite, ou lancer sa commande sur n’importe quelle machine, à voix haute ou par écrit.
---

[`nestor-satellite`](https://pypi.org/project/nestor-satellite/) gère l’appairage, le jeton, le
manifeste, le lien et le texte, sous Python 3.12 ou plus récent. L’audio est l’extra `voice` ; un
appareil qui ne fait qu’écrire s’en passe.

```bash
pip install 'nestor-satellite[voice,sounddevice]'   # voice: WebRTC audio; sounddevice: the machine's microphone and speaker
pip install nestor-satellite                        # a device that only writes
```

L’extra `qr` lit les QR codes d’une caméra.

## Un pilote minimal

Une enceinte avec un micro, une lumière et une sortie texte :

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

Sans code d’enrôlement, il dit un code d’appareil sur son haut-parleur et l’écrit dans son journal :
tapez-le dans l’administration.

## Texte et audio

Le manifeste décrit le corps et les capteurs (`EXPRESSION`, `IDENTIFY`, `HEAD_MOTION`,
`PERSON_DETECTION`, `SPEECH_ACTIVITY`). Le texte et l’audio découlent des arguments ; les déclarer
dans le manifeste lève `ValueError`.

| Argument                                     | Déclare          |
| -------------------------------------------- | ---------------- |
| `text_display=` une fonction `(text, final)` | `text.display`   |
| `text_input=True`                            | `text.input`     |
| `source=` un `AudioSource` (`Microphone()`)  | `audio.capture`  |
| `sink=` un `AudioSink` (`Speaker()`)         | `audio.playback` |

- `satellite.send_text("…")` envoie de 1 à 4 000 caractères tapés. Il renvoie `False` quand le
  lien est coupé et lève `CapabilityNotAllowed` si le foyer n’a pas autorisé `text.input`.
- `final` marque le dernier message d’une réponse.
- `ice_servers=` (des URL STUN ou TURN) ne sert qu’au-delà du réseau local.
- `run` s’arrête quand un lien plus récent du même appareil le remplace. Sinon, il se reconnecte, ou
  s’appaire de nouveau si son jeton est refusé.

## Options d’appairage

Les méthodes d’appairage découlent des arguments.

| Argument                                                              | Déclare                   |
| --------------------------------------------------------------------- | ------------------------- |
| toujours                                                              | `enrollment.provisioning` |
| `display=` un `Display` (`show(text, code)`, `clear()`)               | `device_code.display`     |
| `voice=` une fonction qui dit une phrase, ou un `sink` sans `display` | `device_code.speech`      |
| `enrolls_by=[PairingMethod.INPUT]`                                    | `enrollment.input`        |
| `camera=AvCamera(…)`                                                  | `enrollment.qr`           |

- `enrollment=` prend une URI d’appairage ou un code d’enrôlement. Par défaut, il lit
  `NESTOR_PAIRING_URI`, puis `NESTOR_PAIRING_CODE`.
- `await satellite.enroll("K7QF-2M9X")` envoie un code tapé sur l’appareil. Il renvoie `ACCEPTED`,
  `REFUSED`, `NOT_PENDING` ou `INVALID`. Un code refusé n’est plus jamais envoyé.
- `locale="fr"` règle la langue dans laquelle il parle.
- `run` lève `PairingFailed` quand réessayer ne sert à rien, par exemple face à un cœur dans une
  autre version du protocole.

## La commande

`nestor-satellite run` fait de cette machine un satellite (extras `voice` et `sounddevice`) :

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
# ou
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# ou, avec l’adresse du cœur à part
nestor-satellite run --core http://nestor.local:8471 --room salon --pairing-code K7QF-2M9X
# par écrit seulement : les lignes tapées sont envoyées, les réponses affichées (sans extra)
nestor-satellite run --core http://nestor.local:8471 --room bureau --text --no-voice
```

- `--no-voice` retire le micro et le haut-parleur ; `--text` ajoute l’écrit.
- Sans code, elle dit un code d’appareil.
- `--lang fr` parle français. `--camera 0` lit les QR codes (extra `qr`).

Le jeton est gardé dans `~/.config/nestor-satellite/<id>.json`. `nestor-satellite run --help`
détaille le reste.

## Logiciel et mises à jour

Le manifeste nomme le logiciel que fait tourner l’appareil : `nestor-satellite` et sa version, sauf
si le pilote passe `software=Software("mon-satellite", "0.2.0")`, le paquet sous lequel il est
publié.

`updater=` un `Updater` permet au foyer de mettre l’appareil à jour depuis l’administration, et
déclare `device.update`. Un `Updater` dit quelle version plus récente sa source propose (`newer`) et
en installe une (`install`) ; le SDK en fournit un pour les paquets installés depuis PyPI, avec uv
ou pip. Sans lui, l’administration montre seulement la version.

`nestor-satellite run --managed` s’en sert sur lui-même. Quand une personne demande la mise à jour,
la commande installe la nouvelle version dans son propre environnement, puis relance sa propre
ligne de commande à sa place : aucun gestionnaire de services n’est nécessaire pour revenir. Si la
nouvelle version n’est pas accueillie dans les 60 s, elle réinstalle la précédente et signale
l’échec.

## Pour aller plus loin

- Le code et la licence des enregistrements de voix :
  [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python).
- Un pilote complet : [nestor-reachy](https://github.com/nestor-home/nestor-reachy).
- Les messages et les codes de fermeture : [Protocole](/fr/docs/satellites/protocol/).
- Vérifier le vôtre : [Conformité](/fr/docs/satellites/conformance/).
