---

title: Satellites
description: Les appareils qui donnent à Nestor une voix et un corps, et comment on les appaire.
---

Un satellite est un appareil appairé au serveur Nestor : un Raspberry Pi avec une enceinte, une
tablette murale, un robot Reachy Mini. On tape dessus, on lui parle, ou les deux. Il se connecte au
canal `satellites` sur le port 8471, auquel il faut une [voix](/fr/docs/channels/#voix) pour parler.

## Ce que fait un satellite

Il s’appaire une fois, déclare ses capacités, puis tient un WebSocket avec le serveur ; l’audio
passe en WebRTC. Le serveur envoie des intentions, pas des mouvements : avec `intent.expression` et
`joy`, un robot bouge ses antennes, une simple enceinte l’ignore.

## Capacités

Une caméra ou des moteurs sont facultatifs : l’appareil les déclare, une personne les autorise.

| Capacité                  | L’appareil…                                                   |
| ------------------------- | ------------------------------------------------------------- |
| `text.input`              | envoie ce qu’une personne a tapé                              |
| `text.display`            | affiche les réponses de l’assistant                           |
| `audio.capture`           | envoie son micro au serveur                                   |
| `audio.playback`          | joue la voix du serveur                                       |
| `audio.speech_activity`   | signale quand quelqu’un commence et arrête de parler          |
| `vision.person_detection` | signale une personne qu’il voit                               |
| `expression.emotion`      | montre une émotion (`intent.expression`)                      |
| `motion.head`             | bouge la tête au rythme de la parole (`intent.beat`)          |
| `device.identify`         | se fait remarquer quand quelqu’un le cherche                  |
| `device.update`           | installe une version plus récente de son logiciel sur demande |

## Appairage

Une personne prouve qu’elle le veut, de l’une de deux façons :

- un **code d’appareil** : six chiffres affichés par l’appareil, tapés dans l’administration ;
- un **code d’enrôlement** créé dans l’administration (`K7QF-2M9X`), donné à l’appareil, le plus
  souvent en URI d’appairage : `nestor+http://nestor.local:8471/?code=K7QF2M9X`.

| Méthode                   | La personne…                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `device_code.display`     | lit le code sur l’écran de l’appareil et le tape dans l’administration                     |
| `device_code.speech`      | entend l’appareil dire son code et le tape dans l’administration                           |
| `enrollment.input`        | tape le code d’enrôlement sur l’appareil                                                   |
| `enrollment.provisioning` | met l’URI d’appairage dans la configuration de l’appareil (option, environnement, fichier) |
| `enrollment.qr`           | montre le QR code de l’URI d’appairage à la caméra de l’appareil                           |

Tout appareil accepte `enrollment.provisioning`. Les SDK déclarent les autres selon le matériel.

### Ajouter un satellite

Dans l’administration, ouvrez **Satellites**, puis **Ajouter**, et choisissez une méthode.
**Identifier** fait clignoter ou sonner un appareil en attente. En ligne de commande, pendant que
Nestor tourne :

```bash
nestor satellites add --room salon --name "Enceinte du salon"   # affiche le code et l’URI d’appairage
nestor satellites approve 042917                                # le code présenté par un appareil
nestor satellites revoke enceinte-salon                         # désappaire un appareil
```

`approve --only audio.capture,audio.playback` accorde moins de capacités. Donnez ensuite son URI à
l’appareil :

```bash
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
```

### Mettre à jour un satellite

Un satellite autorisé à `device.update` se met à jour depuis sa page dans l’administration : voir
[Mises à jour](/fr/docs/updates/#mettre-à-jour-un-satellite).

## Prêts à l’emploi

- `nestor-satellite run`, le micro et le haut-parleur de cette machine, dans les SDK
  [Python](/fr/docs/sdks/python/), [TypeScript](/fr/docs/sdks/typescript/) et
  [Rust](/fr/docs/sdks/rust/).
- [`nestor-reachy`](https://github.com/nestor-home/nestor-reachy), pour Reachy Mini (son jumeau
  simulé pour l’instant).
- Un onglet de navigateur, avec le SDK TypeScript.

Pour écrire le vôtre, lisez le [protocole](/fr/docs/satellites/protocol/), les
[schémas](/fr/docs/satellites/schemas/) et la [suite de conformité](/fr/docs/satellites/conformance/).
