---
title: Qui parle
description: Les satellites sont des pièces auxquelles tout le monde parle. Comment Nestor sait qui parle, demande quand ça compte, reconnaît les voix qu’on lui a apprises et réserve les actions sensibles à qui les demande.
---

Un satellite est une pièce, pas une personne. La grand-mère parle à celui de sa chambre, et son
petit-fils aussi quand il passe. Nestor répond à qui parle, et cherche qui c’est, tour par tour.

## Comment il le sait

Chaque tour dit qui a parlé, et comment on le sait :

| Qui          | D’où                                                | Ce que ça permet                                                |
| ------------ | --------------------------------------------------- | --------------------------------------------------------------- |
| un compte    | Telegram, l’admin : le canal s’en porte garant      | tout ce que la personne peut faire                              |
| une voix     | une voix apprise à Nestor, reconnue                 | une réponse personnelle, et ce qui est à elle, dit dans la pièce |
| un prénom    | la personne a dit qui elle est                      | une réponse personnelle ; ce qui est à elle lui est écrit       |
| personne     | un satellite, aucune voix reconnue                  | ce que tout le monde à la maison peut faire                     |

Quelqu’un qu’on ne connaît pas peut allumer la lumière, lancer un minuteur, compléter la liste de
courses, poser une question, ou faire passer un message (« dis à Léa que le dîner est prêt », signé
de la pièce). Ce qui appartient à une personne demande de savoir qui demande : ses mails, ses
rappels, son agenda.

Alors l’agent demande. « Rappelle-moi », « mon rendez-vous », « comme d’habitude » : il demande qui
parle, en quelques mots, puis note la réponse. Le prénom vaut pour la conversation, jusqu’à ce
qu’une autre voix reconnue parle. Il ne demande jamais rien pour allumer une lampe.

Sur un satellite, la conversation est celle de la pièce : plusieurs personnes peuvent y parler, et
l’agent voit qui a dit quoi.

## Reconnaître les voix

Les voix se reconnaissent sur le serveur, à partir de ce que chaque satellite envoie déjà, pendant
la transcription. Un tour ne l’attend pas. Sans modèle de voix, rien ne change, sauf que personne
n’est reconnu.

```yaml
models:
  ears:
    kind: sherpa-onnx-voice
    model: titanet-small

voices:
  embedder: ears
```

Le modèle tourne avec sherpa-onnx (`pip install 'nestor-home[voice-id]'`) et se télécharge une fois.
Mesuré sur le banc `speaker-id` (36 lecteurs LibriVox français, Mac, un fil) :

| `model`                    | refus à tort pour 1 % d’acceptations à tort | par tour | sur disque |
| -------------------------- | ------------------------------------------- | -------- | ---------- |
| `titanet-small` (défaut)   | 4,8 %                                       | 47 ms    | 40 Mo      |
| `3dspeaker-campplus-zh-en` | 4,3 %                                       | 62 ms    | 28 Mo      |
| `3dspeaker-eres2net`       | 4,1 %                                       | 165 ms   | 26 Mo      |

Chacun vient avec son seuil ; `voices.threshold` le remplace. Pas encore mesuré : un Raspberry Pi, les
vrais micros des satellites, les voix d’une même famille.

### Apprendre une voix à Nestor

Personne n’est reconnu sans l’avoir accepté. Nestor garde une empreinte de la voix, jamais
l’enregistrement, et chacun peut effacer la sienne.

- **Dans l’admin**, sur la page de la personne, **Enregistrer ma voix** : ce qui est gardé, le
  micro, cinq phrases à lire, un essai. Chacun enregistre sa propre voix ; un propriétaire l’enregistre
  pour quelqu’un sans compte (un enfant, un grand-parent), qui donne son accord de vive voix. Les
  navigateurs n’ouvrent le micro que sur une page sécurisée : l’admin en https, ou sur la machine
  elle-même (localhost).
- **Sur un satellite** : « apprends à reconnaître ma voix ». Nestor demande qui parle, fait confirmer
  par écrit sur le compte de cette personne, puis lui fait répéter cinq phrases à voix haute. C’est
  le meilleur endroit : le micro et la distance sont les vrais.

### S’affiner avec le temps

Une voix enregistrée une fois s’éloigne : un rhume, un soir de fatigue, une autre pièce. Chaque tour
net, reconnu avec de la marge et assez long, l’enrichit, 50 empreintes au plus, 20 au plus d’une même
pièce. L’enregistrement garde une part fixe de chaque score, pour que l’apprentissage ne s’en
éloigne pas. Un prénom seul n’apprend rien, et dire qui parlait vraiment (« non, c’est Léa ») retire
ce que le tour mal reconnu avait appris.

La page de la personne montre ce qui a été appris, avec un interrupteur pour arrêter, **Oublier ce
qui a été appris** (l’enregistrement reste) et **Oublier ma voix**.

## Actions sensibles

Une voix ou un prénom disent qui parle ; seul un compte s’en porte garant. Les actions qui comptent
sont confirmées par la personne qui les demande :

- sur son compte, dans la conversation : l’agent dit exactement ce qu’il va faire et attend son oui ;
- demandées à voix haute sur un satellite, par écrit sur son compte (« Ouvrir le garage ? »). Une fois
  sa réponse donnée, l’action se fait en son nom, dans la pièce où elle a été demandée, et la pièce
  entend que c’est fait. Sans réponse en cinq minutes, rien ne se passe.

Ça reste rare : lumières, chauffage, messages et rappels ne sont jamais confirmés. Pour Home Assistant,
dont les outils pilotent lampes et serrures pareil, dites quels appels sont sensibles selon ce sur
quoi ils agissent :

```yaml
tools:
  - kind: mcp
    name: home
    url: ${HOME_ASSISTANT_MCP_URL}
    token: ${HOME_ASSISTANT_TOKEN}
    sensitive:
      - tool: intent__HassTurnOn
        arguments: &doors {domain: [lock, alarm_control_panel], device_class: [garage, gate, door],
                           name: [serrure, alarme, garage, portail, porte]}
      - tool: intent__HassTurnOff
        arguments: *doors
```

Une valeur compte quand elle apparaît dans l’argument, sans tenir compte des majuscules. Un appel qui
ne nomme ni la classe ni un appareil reconnu passe sans confirmation : c’est la limite d’une règle
sur les arguments.
