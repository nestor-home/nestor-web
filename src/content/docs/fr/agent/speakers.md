---

title: Locuteurs
description: Comment Nestor sait qui parle à un satellite, reconnaît les voix enregistrées et fait confirmer les actions sensibles.
---

Un satellite appartient à une pièce, pas à une personne. À chaque tour, Nestor établit qui parle et
ce que cela permet.

## Qui parle

| Source  | Quand                                    | Permet                                                                                                            |
| ------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| compte  | Telegram, l’admin : le canal authentifie | tout ce que la personne a le droit de faire                                                                       |
| voix    | un satellite, et la voix est enregistrée | des réponses personnelles, ses propres données lues à voix haute                                                  |
| prénom  | la personne dit qui elle est             | des réponses personnelles ; ses données lui sont envoyées par écrit                                               |
| inconnu | un satellite, aucune voix reconnue       | ce que tout le foyer peut faire : la maison, les minuteurs, les listes partagées, des messages signés de la pièce |

Quand la réponse dépend de la personne (« rappelle-moi »), l’agent demande qui parle et retient la
réponse pour la conversation, jusqu’à ce qu’une autre voix soit reconnue.

## Reconnaissance vocale

Les voix sont reconnues sur le serveur, à partir de l’audio des satellites, pendant la
transcription : aucun délai en plus. Installez `nestor-home[voice-id]` et nommez un modèle de
locuteur ; il se télécharge au premier démarrage. Sans lui, toute personne qui parle à un satellite
est inconnue.

```yaml
models:
  ears:
    type: speaker
    provider: sherpa-onnx
    model: titanet-small

voices:
  embedder: ears
```

| `model`                    | faux rejets à 1 % de fausses acceptations | par tour | taille |
| -------------------------- | ----------------------------------------- | -------- | ------ |
| `titanet-small`            | 4,8 %                                     | 47 ms    | 40 Mo  |
| `3dspeaker-campplus-zh-en` | 4,3 %                                     | 62 ms    | 28 Mo  |
| `3dspeaker-eres2net`       | 4,1 %                                     | 165 ms   | 26 Mo  |

Mesuré avec `nestor bench run speaker-id` sur un thread CPU. `voices.threshold` remplace le seuil
propre à chaque modèle.

## Enregistrer une voix

- **Dans l’administration** : sur la page d’une personne, **Enregistrer ma voix**, puis lire cinq
  phrases. Un propriétaire peut enregistrer quelqu’un qui n’a pas de compte. La page doit être en
  https ou sur localhost.
- **Sur un satellite** : dites « apprends à reconnaître ma voix », confirmez par écrit sur votre
  compte, puis répétez cinq phrases.

Nestor garde une empreinte vocale, jamais l’audio, hors du journal : la supprimer l’efface pour de
bon. Les tours reconnus avec une marge nette l’enrichissent, jusqu’à 50 échantillons (20 par
pièce) ; l’enregistrement initial garde un poids fixe, un prénom seul n’apprend rien, et corriger la personne défait ce qu’un
mauvais tour a appris. La page de la personne permet d’arrêter l’apprentissage, **Oublier ce qui a
été appris** ou **Oublier ma voix**.

## Actions sensibles

Une voix ou un prénom n’autorisent jamais rien. La personne qui demande une action sensible la
confirme sur son propre compte : dans la conversation, ou, si elle l’a demandée à voix haute, par
écrit ou dans l’administration sous **En cours**. L’action s’exécute alors dans la pièce où elle a
été demandée ; sans réponse en cinq minutes, rien ne se passe.

Les lumières, le chauffage, les messages et les rappels ne demandent pas de confirmation. Les
serrures, l’alarme, les garages, les portails et les portes en demandent par défaut : voir
[Home Assistant](/fr/docs/home/#actions-sensibles).
