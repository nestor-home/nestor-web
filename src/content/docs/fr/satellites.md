---

title: Satellites
description: Les appareils qui donnent à Nestor une voix et un corps, et comment on les appaire.
---

Un satellite est un appareil appairé au serveur Nestor : un Raspberry Pi avec une enceinte, un
onglet sur une tablette murale, un robot Reachy Mini. On tape dessus, on lui parle, ou les deux :
un clavier et un écran suffisent, un micro et un haut-parleur aussi. Une caméra ou des moteurs sont
aussi des capacités optionnelles : l’appareil les déclare, une personne les autorise, et rien dans
Nestor ne suppose qu’elles sont là.

Les satellites se connectent au canal `satellites` du serveur, sur le port 8471 (son `port` dans
`nestor.yaml`). À l’écrit, il ne leur faut rien de plus ; pour parler à voix haute, donnez une
`voice` au canal, avec l’extra `voice` (voir [Canaux et voix](/fr/docs/channels/#voix)).

## Ce que fait un satellite

- Il s’appaire une fois et garde son jeton.
- Il déclare dans un manifeste qui il est et ce qu’il sait faire.
- Il tient un lien avec le serveur, un WebSocket qui porte tous les messages.
- Il parle avec l’assistant par écrit, à voix haute ou les deux : le texte tapé et les réponses
  écrites passent par le lien, l’audio dans les deux sens en WebRTC.
- Il exécute les intentions du serveur et accuse réception de chacune.
- Il remonte les observations qu’on lui a permises (activité vocale, personne détectée).

Le serveur demande des intentions, jamais des mouvements. Avec `intent.expression` et `joy`, un
robot bouge la tête et les antennes, un écran pourrait dessiner un visage, une simple enceinte
l’ignore.

## Capacités

| Capacité                  | L’appareil…                                          |
| ------------------------- | ---------------------------------------------------- |
| `text.input`              | envoie ce qu’une personne a tapé                     |
| `text.display`            | affiche les réponses de l’assistant                  |
| `audio.capture`           | envoie son micro au serveur                          |
| `audio.playback`          | joue la voix du serveur                              |
| `audio.speech_activity`   | signale quand quelqu’un commence et arrête de parler |
| `vision.person_detection` | signale une personne qu’il voit                      |
| `expression.emotion`      | montre une émotion (`intent.expression`)             |
| `motion.head`             | bouge la tête au rythme de la parole (`intent.beat`) |
| `device.identify`         | se fait remarquer quand quelqu’un le cherche         |

## Appairage

Appairer demande une preuve qu’une personne le voulait. Elle circule dans un sens ou dans l’autre,
et la première acceptée gagne :

- un **code d’appareil**, six chiffres que l’appareil présente et que la personne tape dans
  l’administration ;
- un **code d’enrôlement** créé dans l’administration (`K7QF-2M9X`), que la personne donne à
  l’appareil, le plus souvent sous forme d’URI d’appairage :
  `nestor+http://nestor.local:8471/?code=K7QF2M9X`.

| Méthode                   | La personne…                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `device_code.display`     | lit le code sur l’écran de l’appareil et le tape dans l’administration                     |
| `device_code.speech`      | entend l’appareil dire son code et le tape dans l’administration                           |
| `enrollment.input`        | tape le code d’enrôlement sur l’appareil                                                   |
| `enrollment.provisioning` | met l’URI d’appairage dans la configuration de l’appareil (option, environnement, fichier) |
| `enrollment.qr`           | montre le QR code de l’URI d’appairage à la caméra de l’appareil                           |

Tout appareil accepte `enrollment.provisioning` ; les autres méthodes découlent de ce qu’il a (un
écran, un haut-parleur, un clavier, une caméra). Les SDK les déclarent pour vous.

### Ajouter un satellite

Dans l’administration, ouvrez **Satellites**, puis **Ajouter**, et choisissez une méthode. Vous
pouvez nommer l’appareil, le placer dans une pièce et restreindre ses capacités. Avec une méthode
d’enrôlement, l’administration affiche le code et son URI d’appairage ; avec un code d’appareil,
elle liste les appareils en attente et vous tapez le code du bon (**Identifier** le fait clignoter
ou sonner pour les distinguer).

La même chose depuis la ligne de commande du serveur, pendant que Nestor tourne :

```bash
nestor satellites add --room salon --name "Enceinte du salon"   # affiche le code et l’URI d’appairage
nestor satellites approve 042917                                # le code présenté par un appareil
nestor satellites revoke enceinte-salon                         # désappaire un appareil
```

`approve --only audio.capture,audio.playback` accorde moins de capacités que l’appareil n’en a
déclaré. Puis, sur l’appareil, donnez-lui l’URI d’appairage :

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
```

## Prêts à l’emploi

- `nestor-satellite run` : le micro et le haut-parleur de cette machine, avec le SDK
  [Python](/fr/docs/sdks/python/), [TypeScript](/fr/docs/sdks/typescript/) ou
  [Rust](/fr/docs/sdks/rust/).
- [`nestor-reachy`](https://github.com/nestor-home/nestor-reachy) : Reachy Mini, dont la tête et
  les antennes suivent la conversation (son jumeau simulé pour l’instant).
- Un onglet de navigateur, avec le SDK TypeScript.

Pour écrire le vôtre, le [protocole](/fr/docs/satellites/protocol/) fait foi, les
[schémas](/fr/docs/satellites/schemas/) donnent la forme de chaque message et la
[suite de conformité](/fr/docs/satellites/conformance/) vérifie un appareil sur les deux.
