---

title: Locuteurs
description: Comment Nestor sait qui parle à un satellite, reconnaît les voix enregistrées et fait confirmer les actions sensibles.
---

Un satellite appartient à une pièce, pas à une personne.

## Qui parle

| Source  | Quand                                    | Permet                                                                                                            |
| ------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| compte  | Telegram, l’admin : le canal authentifie | tout ce que la personne a le droit de faire                                                                       |
| voix    | un satellite, et la voix est enregistrée | des réponses personnelles, ses propres données lues à voix haute                                                  |
| prénom  | la personne dit qui elle est             | des réponses personnelles ; ses données lui sont envoyées par écrit                                               |
| inconnu | un satellite, aucune voix reconnue       | ce que tout le foyer peut faire : la maison, les minuteurs, les listes partagées, des messages signés de la pièce |

Pour une demande personnelle (« rappelle-moi »), l’agent demande qui parle.

## Reconnaissance vocale

La reconnaissance tourne sur le serveur, sans délai en plus. Installez `nestor-home[voice-id]` et
nommez un modèle de locuteur (téléchargé au premier démarrage) ; sans lui, qui parle à un satellite
reste inconnu.

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

Par tour, sur un thread CPU. `voices.threshold` remplace le seuil du modèle.

## Enregistrer une voix

- **Dans l’administration** : page d’une personne, **Enregistrer ma voix**, lire cinq phrases. Exige
  https ou localhost. Un propriétaire peut enregistrer quelqu’un sans compte.
- **Sur un satellite** : dites « apprends à reconnaître ma voix », confirmez par écrit, répétez cinq
  phrases.

Nestor garde une empreinte vocale, jamais l’audio, hors du journal : la supprimer est définitif. Les
tours nettement reconnus l’enrichissent (jusqu’à 50 échantillons, 20 par pièce) ; corriger la
personne défait un mauvais tour. Sa page propose
**Oublier ce qui a été appris** et **Oublier ma voix**, ou arrête l’apprentissage.

## Actions sensibles

Une voix ou un prénom n’autorisent jamais rien : la personne confirme sur son compte, par écrit ou
sous **En cours** dans l’administration. L’action s’exécute alors dans la pièce ; sans réponse en
cinq minutes, rien ne se passe.

Par défaut, serrures, alarme, garages, portails et portes l’exigent ; lumières, chauffage, messages
et alertes non ([Home Assistant](/fr/docs/home/#actions-sensibles)).
