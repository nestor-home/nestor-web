---

title: Le journal
description: Ce que Nestor note, la forme d’un enregistrement, les événements d’une veille de la demande à la réponse, et comment un module déclare les siens.
---

Tout ce que fait Nestor est un événement de son journal, chaque décision avec sa raison. C’est un
seul fichier SQLite, `state/nestor.db`, où l’on ne fait qu’ajouter. Les longs résultats d’outil, les
fichiers et les empreintes vocales restent dehors.

## Un enregistrement

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

| Champ             | Contient                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `type`, `version` | comment lire le payload                                                                       |
| `at`              | l’heure, en UTC                                                                               |
| `source`          | la partie de Nestor qui l’a écrit                                                             |
| `session`         | l’endroit où cela s’est dit (`satellites:cuisine`), pour ce qui appartient à une conversation |

## Une veille, de la demande à la réponse

Dans la cuisine, Léa dit « préviens-moi dès que l’école répond ». Le mail arrive pendant qu’elle
est dans le bureau :

| Événement                        | Écrit quand                                      | Son payload contient                                                                       |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `conversation.turn.user`         | elle demande                                     | ses mots, l’endroit (`satellites:cuisine`), qui a parlé et comment on le sait              |
| `agent.tool.called`              | l’agent appelle l’outil qui crée une veille      | l’outil et ses arguments                                                                   |
| `watch.created`                  | la veille existe                                 | son titre, ce qu’elle guette, les types d’éléments, sa propriétaire, le tour qui l’a créée |
| `conversation.turn.assistant`    | l’agent confirme                                 | ce qu’elle a entendu                                                                       |
| `watch.sorted`                   | un modèle a lu le nouveau mail                   | le mail, les veilles auxquelles il a été comparé, celles qu’il concerne                    |
| `watch.triggered`                | il concerne la sienne                            | le mail, un résumé, s’il est urgent                                                        |
| `initiative.considered`          | le coursier a décidé où le lui dire              | la raison, et l’endroit choisi à voix haute ou par écrit                                   |
| `conversation.turn.notification` | l’annonce entre dans la conversation de la pièce | ce que l’agent reçoit à dire                                                               |
| `conversation.turn.assistant`    | l’agent le lui dit                               | ce qu’elle a entendu                                                                       |
| `initiative.delivered`           | c’est arrivé jusqu’à elle                        | où, et à quel sujet                                                                        |

Une veille d’un seul élément se termine alors (`watch.ended`). Tous les événements d’un tour portent
le même `exchange` (identifiants de conversation et de tour).
Le `speaker` du tour dit qui a parlé et comment on le sait : `account`, `voice` (avec sa
proximité), `said` ou `unknown`.

La décision du coursier :

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

La raison est un identifiant de message avec ses valeurs, affiché dans la langue de qui lit
(« Léa est dans la pièce « bureau » »).

## Dans l’administration

Le **Journal** affiche les événements en direct, en fils de conversation, filtrés par personne,
canal, pièce et catégorie. Une entrée s’ouvre sur ce qu’elle dit, ce à quoi elle se rapporte et son
enregistrement brut.

## Déclarer un événement

Un module ou un [plugin](/fr/docs/plugins/) déclare un événement par une classe :

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

Chaque type appartient à une seule classe. Un payload ne contient que des données simples (texte,
nombres, booléens, dates, énumérations, listes, enregistrements de ces types) : le journal se lit
sans le code.

Pour changer un payload, montez `version` et écrivez l’`upgrade` depuis la version précédente ; les
anciens enregistrements sont mis à niveau à la lecture. L’administration range les catégories
inconnues sous **Autres**.
