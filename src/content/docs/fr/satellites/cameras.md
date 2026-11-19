---

title: Caméras et appels
description: Regarder ce que filme un satellite, prendre une photo, appeler par un satellite, et choisir quand sa caméra reste coupée.
---

Un satellite autorisé à `video.capture` se regarde depuis l’administration. Un satellite qui
entend et joue du son peut être appelé : vous parlez à travers lui et entendez la pièce, avec sa
vidéo s’il filme.

## Regarder, prendre une photo, appeler

Ouvrez une pièce dans **Aujourd’hui** ou **La maison**. Chaque satellite y a **Voir**, **Photo** et
**Appeler**.

- Rien ne sort d’un appareil hors d’une session ouverte par une personne.
- L’appareil ne se connecte qu’au serveur, qui relaie vers votre navigateur.
- L’appareil montre qu’il filme ou qu’il est en appel, s’il a un voyant ou un écran.
- Pendant un appel, l’assistant n’écoute pas cette pièce.
- Chaque session et chaque image vont au [journal](/fr/docs/agent/journal/). Les images sont
  gardées 7 jours.

## Prérequis

| Il faut                             | Pourquoi                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| l’extra `media`                     | `pip install 'nestor-home[media]'` sur le serveur                             |
| TLS (`wss`)                         | un satellite ne filme que par TLS, sauf s’il tourne sur la machine du serveur |
| `video.capture`                     | pour regarder et prendre des photos                                           |
| `audio.capture` et `audio.playback` | pour appeler                                                                  |

## Qui peut regarder et appeler

| Qui             | Scopes                             | Utilise                                 |
| --------------- | ---------------------------------- | --------------------------------------- |
| propriétaires   | `media.view.all`, `media.call.all` | tous les appareils                      |
| admins, membres | `media.view`, `media.call`         | seulement les appareils qui les listent |

Réglez qui peut regarder ou appeler sur la page de chaque satellite, sous **Voir et appeler**.
Les rôles sont dans [Configuration](/fr/docs/configuration/#administration).

## L’assistant regarde aussi

Quand une personne lui demande par écrit, depuis son propre compte, « la lumière du salon est
allumée ? », l’assistant prend une image avec l’outil `look` et la regarde. Il le fait seulement si
cette personne a le droit de voir la pièce et que son modèle voit les images.

À voix haute, il demande d’écrire depuis son compte : une voix ne prouve pas qui parle.

## Confidentialité

Sans règle, une caméra filme dès qu’une personne autorisée le demande. Sur la page de chaque
satellite, à côté de qui peut regarder, vous pouvez ajouter :

| Règle                                  | Coupe la caméra…                                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| heures calmes                          | sur des plages à l’heure du foyer, les jours choisis ; une plage peut passer minuit (22:00 à 07:00)                                                        |
| coupée quand quelqu’un est à la maison | quand quelqu’un du foyer, ou une des personnes choisies, est à la maison selon [Home Assistant](/fr/docs/home/) ; s’il ne sait pas, la caméra reste coupée |

Une règle vaut pour la vue en direct, les images, la vidéo d’un appel et `look`. Elle coupe une
session qu’elle n’autorise plus, y compris un appel par cet appareil, et le journal dit pourquoi.

## Pour les fabricants d’appareils

Les règles qu’un appareil suit pendant une session (M1 à M7) sont dans le
[protocole](/fr/docs/satellites/protocol/#91-sessions).
