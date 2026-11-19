---

title: The journal
description: What Nestor writes down, what a record looks like, the events of one watch from the request to the answer, and how a module declares its own.
---

Everything Nestor does is an event in its journal, each decision with its reason. The admin, the
memory and the tasks that survive a restart all read from it. It is one SQLite file,
`state/nestor.db`; records are added, never changed. Long tool results, files and voiceprints stay
out of it.

## A record

Every event has the same envelope around its own `payload`:

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
in the office. The journal holds, in order:

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

A watch for one item ends once it has matched (`watch.ended`). Every event of a turn carries the
same `exchange`, a conversation id and a turn id, by which the admin groups them. The turn's
`speaker` says who spoke: a person, how they are known (`account`, `voice`, `said` or `unknown`)
and, for a voice, how close it was ([Speakers](/docs/agent/speakers/)).

The decision answers "why did it speak to me here?":

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

The reason is a message id with its values, never a sentence: the admin renders it in the reader's
language ("Léa is in the office"). The other cases are on [Initiative](/docs/agent/initiative/).

## In the admin

The **Journal** shows the events live, as conversation threads. Filter them by person, channel,
room and kind (conversations, unprompted messages, tools, tasks, watches, reminders, memories,
connections, presence, satellites, voices, observations, accounts). An entry opens on what it says,
what it relates to and its raw record.

## Declaring an event

A module, or a [plugin](/docs/plugins/), declares an event in one line and publishes it to the
journal. This is the server's own:

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

The class becomes a frozen, typed record, registered under its type, which no other class may
take. A payload holds plain data only (text, numbers, booleans, dates, enumerations, lists, and
records of these), so the journal reads without the code that wrote it.

To change a payload, raise `version` and write the event's `upgrade` from the version before. Old
records are upgraded as they are read; the file is never rewritten. The admin files an event of
unknown kind under **Other**.
