---

title: The journal
description: What Nestor writes down, what a record looks like, the events of one watch from the request to the answer, and how a module declares its own.
---

Everything Nestor does is an event in its journal: each turn, tool call, task, memory, message it
brings by itself, and each decision with its reason. The admin, the tasks that survive a restart and
the memory are all read from it.

## Where it lives

The journal is in `state/nestor.db`, one SQLite file. Records are added, never changed. What would
weigh it down stays out of it: a long tool result, a file, a voiceprint.

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

- `type` and `version` say how to read the payload.
- `at` is the time, in UTC.
- `source` is the part of Nestor that wrote it.
- `session` is where it was said (`satellites:kitchen`), for what belongs to a conversation.

## One watch, from the request to the answer

In the kitchen, Léa says “tell me as soon as the school writes back”. That afternoon the mail
arrives while she is in the office. The journal holds, in order:

| Event                            | Written when                                   | Its payload holds                                                        |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `conversation.turn.user`         | she asks                                       | her words, where (`satellites:kitchen`), who spoke and how that is known |
| `agent.tool.called`              | the agent calls the tool that creates a watch  | the tool and its arguments                                               |
| `watch.created`                  | the watch exists                               | what to watch for, the kinds of items, its owner, the turn that asked    |
| `conversation.turn.assistant`    | the agent confirms                             | what she heard                                                           |
| `watch.sorted`                   | a model has read the new mail                  | the mail, the watches it was read against, those it matches              |
| `watch.triggered`                | it matches hers                                | the mail, a summary, whether it is urgent                                |
| `initiative.considered`          | the courier has decided where to tell her      | the reason, and the place chosen aloud or in writing                     |
| `conversation.turn.notification` | the match enters the conversation of that room | what the agent is given to tell                                          |
| `conversation.turn.assistant`    | the agent tells her                            | what she heard                                                           |
| `initiative.delivered`           | it reached her                                 | where, and what it was about                                             |

A watch for one item ends once it has matched (`watch.ended`).

Every event of a turn carries the same `exchange`: a conversation id and a turn id. The admin groups
them by it.

“Who spoke” is the turn's `speaker`: a person, how they are known (`account`, `voice`, `said` or
`unknown`) and, for a voice, how close it was. See [Speakers](/docs/agent/speakers/).

The decision is what answers “why did it speak to me here?”:

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
language (“Léa is in the office”). The other reasons are on [Initiative](/docs/agent/initiative/).

## Reading it in the admin

The **Journal** page shows the events as conversation threads, live. Filter them by person, channel,
room and kind (conversations, unprompted messages, tools, tasks, watches, reminders, memories,
connections, presence, satellites, voices, observations, accounts). An entry opens with what it says, what it relates to and
its raw record.

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

The class becomes a frozen, typed record, registered under its type; two classes cannot share one.
A payload holds plain data only (text, numbers, booleans, dates, enumerations, lists, and records
made of these), so the journal stays readable without the code that wrote it.

To change a payload, raise the event's `version` and write its `upgrade`, which turns a record of
the version before into the new one. Older records are upgraded as they are read; the file is never
rewritten. The admin files an event it has no kind for under **Other**.
