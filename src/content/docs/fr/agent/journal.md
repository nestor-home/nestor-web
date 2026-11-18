---

title: Le journal
description: Ce que Nestor note, la forme d’un enregistrement, les événements d’une veille de la demande à la réponse, et comment un module déclare les siens.
---

Tout ce que fait Nestor est un événement de son journal : chaque tour, appel d’outil, tâche,
souvenir, message qu’il apporte de lui-même, et chaque décision avec sa raison. L’administration, les
tâches qui survivent à un redémarrage et la mémoire se lisent dedans.

## Où il se trouve

Le journal est dans `state/nestor.db`, un seul fichier SQLite. Les enregistrements s’ajoutent et ne
changent jamais. Ce qui l’alourdirait reste dehors : un long résultat d’outil, un fichier, une
empreinte vocale.

## Un enregistrement

Chaque événement a la même enveloppe autour de son `payload` :

```json
{
  "type": "watch.triggered",
  "version": 1,
  "id": "f2c56b111bef4c819385fe7b8daddfb2",
  "at": "2026-11-02T16:41:02+00:00",
  "source": "watch-keeper",
  "session": null,
  "payload": {
    "watch_id": "4b10c2e7",
    "item_id": "18c2f0a94be1d377",
    "item_title": "Re: Sortie de vendredi",
    "item_source": "gmail-lea",
    "summary": "L’école confirme la sortie de vendredi ; prévoir un pique-nique.",
    "urgent": false
  }
}
```

- `type` et `version` disent comment lire le payload.
- `at` est l’heure, en UTC.
- `source` est la partie de Nestor qui l’a écrit.
- `session` est l’endroit où cela s’est dit (`satellites:cuisine`), pour ce qui appartient à une
  conversation.

## Une veille, de la demande à la réponse

Dans la cuisine, Léa dit « préviens-moi dès que l’école répond ». L’après-midi, le mail arrive
pendant qu’elle est dans le bureau. Le journal contient, dans l’ordre :

| Événement                        | Écrit quand                                      | Son payload contient                                                            |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `conversation.turn.user`         | elle demande                                     | ses mots, l’endroit (`satellites:cuisine`), qui a parlé et comment on le sait   |
| `agent.tool.called`              | l’agent appelle l’outil qui crée une veille      | l’outil et ses arguments                                                        |
| `watch.created`                  | la veille existe                                 | ce qu’elle guette, les types d’éléments, sa propriétaire, le tour qui l’a créée |
| `conversation.turn.assistant`    | l’agent confirme                                 | ce qu’elle a entendu                                                            |
| `watch.sorted`                   | un modèle a lu le nouveau mail                   | le mail, les veilles auxquelles il a été comparé, celles qu’il concerne         |
| `watch.triggered`                | il concerne la sienne                            | le mail, un résumé, s’il est urgent                                             |
| `initiative.considered`          | le coursier a décidé où le lui dire              | la raison, et l’endroit choisi à voix haute ou par écrit                        |
| `conversation.turn.notification` | l’annonce entre dans la conversation de la pièce | ce que l’agent reçoit à dire                                                    |
| `conversation.turn.assistant`    | l’agent le lui dit                               | ce qu’elle a entendu                                                            |
| `initiative.delivered`           | c’est arrivé jusqu’à elle                        | où, et à quel sujet                                                             |

Une veille qui attend un seul élément se termine dès qu’il est trouvé (`watch.ended`).

Tous les événements d’un tour portent le même `exchange` : un identifiant de conversation et un
identifiant de tour. L’administration les regroupe ainsi.

« Qui a parlé » est le `speaker` du tour : une personne, la façon dont on la connaît (`account`,
`voice`, `said` ou `unknown`) et, pour une voix, sa proximité. Voir
[Locuteurs](/fr/docs/agent/speakers/).

La décision répond à « pourquoi m’a-t-il parlé ici ? » :

```json
{
  "type": "initiative.considered",
  "version": 1,
  "id": "a6e61519da9b498ba675b895756a9971",
  "at": "2026-11-02T16:41:03+00:00",
  "source": "courier",
  "session": null,
  "payload": {
    "about": { "source": "watch", "id": "4b10c2e7", "status": "" },
    "reason": { "id": "delivery-in-room", "args": { "person": "Léa", "room": "bureau" } },
    "spoken": { "channel": "satellites", "conversation": "bureau" },
    "written": null,
    "person": "lea"
  }
}
```

La raison est un identifiant de message avec ses valeurs, jamais une phrase : l’administration
l’affiche dans la langue de qui lit (« Léa est dans la pièce « bureau » »). Les autres raisons sont
dans [Initiative](/fr/docs/agent/initiative/).

## Le lire dans l’administration

La page **Journal** affiche les événements en fils de conversation, en direct. Filtrez-les par
personne, canal, pièce et catégorie (conversations, prises de parole, outils, tâches, veilles,
rappels, souvenirs, connexions, présence, satellites, voix, observations, comptes). Une entrée
s’ouvre sur ce qu’elle dit, ce à quoi elle se rapporte et son enregistrement brut.

## Déclarer un événement

Un module, ou un [plugin](/fr/docs/plugins/), déclare un événement en une ligne et le publie dans le
journal. Celui-ci est celui du serveur :

```python
from nestor.core import Event


class WatchTriggered(Event, event_type="watch.triggered"):
    watch_id: str
    item_id: str
    item_title: str
    item_source: str
    summary: str
    urgent: bool = False
```

La classe devient un enregistrement figé et typé, inscrit sous son type ; deux classes ne peuvent pas
partager le même. Un payload ne contient que des données simples (texte, nombres, booléens, dates,
énumérations, listes, et enregistrements faits de ces types) : le journal reste lisible sans le code
qui l’a écrit.

Pour changer un payload, montez la `version` de l’événement et écrivez son `upgrade`, qui transforme
un enregistrement de la version précédente en la nouvelle. Les anciens enregistrements sont mis à
niveau à la lecture ; le fichier n’est jamais réécrit. L’administration range sous **Autres** un
événement dont elle ne connaît pas la catégorie.
