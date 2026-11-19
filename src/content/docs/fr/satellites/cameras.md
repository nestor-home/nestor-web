---

title: Caméras et appels
description: Regarder ce que filme un satellite, prendre une photo, appeler par un satellite, et choisir quand sa caméra reste coupée.
---

Regardez depuis l’admin un satellite qui filme, ou appelez-en un qui entend et joue du son.

## Regarder, prendre une photo, appeler

Ouvrez une pièce dans **Aujourd’hui** ou **La maison** : chaque satellite a **Voir**, **Photo** et
**Appeler**.

- Rien ne sort d’un appareil hors d’une session ouverte par une personne.
- Le serveur relaie l’appareil vers votre navigateur.
- Un appareil avec voyant ou écran montre qu’il filme ou qu’il est en appel.
- Pendant un appel, l’assistant n’écoute pas cette pièce.
- Sessions et images vont au [journal](/fr/docs/agent/journal/) ; les images sont gardées 7 jours.

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

Réglez-le sur la page de chaque satellite, sous **Voir et appeler**
([rôles](/fr/docs/configuration/#administration)).

## L’assistant regarde aussi

Interrogé par écrit depuis le compte d’une personne (« la lumière du salon est allumée ? »),
l’assistant prend une image avec `look`, si cette personne peut voir la pièce et que son modèle voit
les images. À voix haute, il demande d’écrire : une voix ne prouve pas qui parle.

## Confidentialité

Sans règle, une caméra filme dès qu’une personne autorisée le demande. Règles, sur la page de chaque
satellite :

| Règle                                  | Coupe la caméra…                                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| heures calmes                          | sur des plages à l’heure du foyer, les jours choisis ; une plage peut passer minuit (22:00 à 07:00)                                                        |
| coupée quand quelqu’un est à la maison | quand quelqu’un du foyer, ou une des personnes choisies, est à la maison selon [Home Assistant](/fr/docs/home/) ; s’il ne sait pas, la caméra reste coupée |

Une règle vaut pour la vue, les images, la vidéo d’un appel et `look`, et coupe une session qu’elle
n’autorise plus ; le journal dit pourquoi.

## Pour les fabricants d’appareils

Règles de session M1 à M7 : [protocole](/fr/docs/satellites/protocol/#91-sessions).
