---

title: The journal
description: What Nestor writes down, what a record looks like, the events of one watch from the request to the answer, and how a module declares its own.
---

Everything Nestor does is an event in its journal, each decision with its reason. It is one SQLite
file, `state/nestor.db`, append-only. Long tool results, files and voiceprints stay out of it.

## A record

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
    "item_title": "Re: Friday's outing",
    "item_source": "gmail-lea",
    "summary": "The school confirms Friday's outing; bring a packed lunch.",
    "urgent": false
  }
}
```

| Field             | Holds                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `type`, `version` | how to read the payload                                                      |
| `at`              | the time, in UTC                                                             |
| `source`          | the part of Nestor that wrote it                                             |
| `session`         | where it was said (`satellites:kitchen`), for what belongs to a conversation |

## One watch, from the request to the answer

Léa says in the kitchen "tell me as soon as the school writes back". The mail arrives while she is
in the office:

| Event                            | Written when                                   | Its payload holds                                                                |
| -------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `conversation.turn.user`         | she asks                                       | her words, where (`satellites:kitchen`), who spoke and how that is known         |
| `agent.tool.called`              | the agent calls the tool that creates a watch  | the tool and its arguments                                                       |
| `watch.created`                  | the watch exists                               | its title, what to watch for, the kinds of items, its owner, the turn that asked |
| `conversation.turn.assistant`    | the agent confirms                             | what she heard                                                                   |
| `watch.sorted`                   | a model has read the new mail                  | the mail, the watches it was read against, those it matches                      |
| `watch.triggered`                | it matches hers                                | the mail, a summary, whether it is urgent                                        |
| `initiative.considered`          | the courier has decided where to tell her      | the reason, and the place chosen aloud or in writing                             |
| `conversation.turn.notification` | the match enters the conversation of that room | what the agent is given to tell                                                  |
| `conversation.turn.assistant`    | the agent tells her                            | what she heard                                                                   |
| `initiative.delivered`           | it reached her                                 | where, and what it was about                                                     |

A one-item watch then ends (`watch.ended`). Every event of a turn carries the same `exchange` (conversation and turn ids). The turn's `speaker`
says who spoke and how that is known: `account`, `voice` (with its closeness), `said` or `unknown`.

The courier's decision:

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
    "reason": { "id": "delivery-in-room", "args": { "person": "Léa", "room": "office" } },
    "spoken": { "channel": "satellites", "conversation": "office" },
    "written": null,
    "person": "lea"
  }
}
```

The reason is a message id with values, rendered in the reader's language ("Léa is in the office").

## In the admin

**Journal** shows events live, as conversation threads, filtered by person, channel, room and kind.
An entry opens on what it says, what it relates to and its raw record.

## Declaring an event

A module or a [plugin](/docs/plugins/) declares an event as a class:

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

Each type belongs to one class. A payload holds plain data only (text, numbers, booleans, dates,
enumerations, lists, records of these), so the journal reads without the code.

To change a payload, raise `version` and write `upgrade` from the version before; old records are
upgraded on read. The admin files unknown kinds under **Other**.
