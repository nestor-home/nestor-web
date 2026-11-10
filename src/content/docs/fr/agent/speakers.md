---

title: Locuteurs
description: Comment Nestor sait qui parle à un satellite, reconnaît les voix enregistrées et fait confirmer les actions sensibles.
---

Un satellite appartient à une pièce, pas à une personne : tout le monde dans la pièce peut lui parler.
Nestor identifie la personne qui parle à chaque tour.

## Comment la personne est identifiée

| Source  | Quand                                    | Permet                                                              |
| ------- | ---------------------------------------- | ------------------------------------------------------------------- |
| compte  | Telegram, l’admin : le canal authentifie | tout ce que la personne a le droit de faire                         |
| voix    | un satellite, et la voix est enregistrée | des réponses personnelles, ses propres données lues à voix haute    |
| prénom  | la personne dit qui elle est             | des réponses personnelles ; ses données lui sont envoyées par écrit |
| inconnu | un satellite, aucune voix reconnue       | ce que tout le foyer peut faire                                     |

Une personne inconnue peut piloter la maison, lancer des minuteurs, utiliser les listes partagées et
faire passer des messages. Un message transmis ainsi est signé de la pièce d’où il vient.

Quand la réponse dépend de la personne (« rappelle-moi », « mon rendez-vous »), l’agent demande qui
parle et retient la réponse pour la suite de la conversation. Une autre voix reconnue l’annule.

## Reconnaissance vocale

Les voix sont reconnues sur le serveur, à partir de l’audio que les satellites envoient déjà. La
reconnaissance se fait pendant la transcription et n’ajoute aucun délai au tour. Sans modèle de locuteur,
toute personne qui parle à un satellite est inconnue.

```yaml
models:
  ears:
    type: speaker
    provider: sherpa-onnx
    model: titanet-small

voices:
  embedder: ears
```

Installez l’extra avec `pip install 'nestor-home[voice-id]'`. Le modèle se télécharge au premier
démarrage. Mesuré avec `nestor bench run speaker-id`, sur un fil de calcul :

| `model`                    | refus à tort pour 1 % d’acceptations à tort | par tour | taille |
| -------------------------- | ------------------------------------------- | -------- | ------ |
| `titanet-small` (défaut)   | 4,8 %                                       | 47 ms    | 40 Mo  |
| `3dspeaker-campplus-zh-en` | 4,3 %                                       | 62 ms    | 28 Mo  |
| `3dspeaker-eres2net`       | 4,1 %                                       | 165 ms   | 26 Mo  |

Chaque modèle a son seuil ; `voices.threshold` le remplace.

### Enregistrer une voix

- **Dans l’admin** : sur la page d’une personne, **Enregistrer ma voix**. La personne lit cinq phrases.
  Un propriétaire peut enregistrer la voix de quelqu’un sans compte. Le navigateur demande une page
  sécurisée : https, ou localhost.
- **Sur un satellite** : dites « apprends à reconnaître ma voix ». La personne confirme par écrit sur
  son propre compte, puis répète cinq phrases à voix haute.

Nestor garde une empreinte de la voix, jamais l’audio. Les empreintes sont rangées hors du journal :
en supprimer une l’efface complètement.

### Apprentissage au fil du temps

Chaque tour reconnu avec une marge nette enrichit la voix de la personne, jusqu’à 50 échantillons
(20 par pièce). L’enregistrement de départ garde toujours un poids fixe dans le score. Un prénom seul
n’apprend rien, et corriger la personne qui parlait retire ce que le tour mal reconnu avait appris.

La page de la personne dans l’admin montre ce qui a été appris, avec un interrupteur pour arrêter,
**Oublier ce qui a été appris** et **Oublier ma voix**.

## Actions sensibles

Une voix reconnue ou un prénom n’autorisent jamais rien. Les actions sensibles sont confirmées par la
personne qui les demande :

- sur son propre compte, dans la conversation ;
- demandées à voix haute sur un satellite, par écrit sur son compte. L’action se fait une fois
  confirmée, dans la pièce où elle a été demandée. Sans réponse en cinq minutes, rien ne se passe.

Lumières, chauffage, messages et rappels ne demandent aucune confirmation. Pour Home Assistant,
`sensitive` dit ce qui en demande une, quelle que soit l’action ; par défaut, serrures, alarme,
garages, portails et portes :

```yaml
home:
  kind: home-assistant
  url: ${HOME_ASSISTANT_URL}
  token: ${HOME_ASSISTANT_TOKEN}
  sensitive:
    domains: [lock, alarm_control_panel]
    device_classes: [garage, gate, door]
    names: [serrure, alarme, garage, portail, porte]
```

Une action est sensible quand l’une de ces valeurs apparaît dans son domaine, sa classe ou son nom,
sans tenir compte des majuscules. La personne répond dans la conversation, ou sur la page
**Messages** de l’admin.
