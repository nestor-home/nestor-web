---

title: Who is speaking
description: Satellites are rooms anyone talks to. How Nestor knows who speaks, asks when it matters, recognises voices it was taught, and keeps sensitive actions for the person who asks.
---

A satellite is a room, not a person. The grandmother talks to the one in her bedroom, and so does her
grandson when he visits. Nestor answers whoever speaks, and works out who it is turn by turn.

## How it knows

Each turn says who spoke and how anyone knows:

| Who        | From                                     | What it allows                                          |
| ---------- | ---------------------------------------- | ------------------------------------------------------- |
| an account | Telegram, the admin: the channel vouches | everything the person may do                            |
| a voice    | a voice Nestor was taught, recognised    | a personal answer, and what is theirs, said in the room |
| a name     | they said who they are                   | a personal answer; what is theirs is written to them    |
| nobody     | a satellite, no voice recognised         | what anyone at home may do                              |

Someone nobody knows can turn on the lights, set a timer, add to the shopping list, ask a question,
or have a message passed on ("tell Léa dinner is ready", signed with the room). What belongs to one
person needs to know who asks: their mail, their reminders, their agenda.

So the agent asks. "Remind me", "my appointment", "as usual": it asks who it is, in a few words, then
records the answer. The name holds for the conversation, until another recognised voice speaks. It
never asks to turn on a light.

On a satellite the conversation is the room's: several people may speak in it, and the agent sees
who said what.

## Recognising voices

Voices are recognised on the server, from what every satellite already sends, while the speech is
transcribed. A turn does not wait for it. Without a voice model, nothing changes but that nobody is
recognised.

```yaml
models:
  ears:
    kind: sherpa-onnx-voice
    model: titanet-small

voices:
  embedder: ears
```

The model runs with sherpa-onnx (`pip install 'nestor-home[voice-id]'`) and downloads once. Measured on
the `speaker-id` bench (36 French LibriVox readers, Mac, one thread):

| `model`                    | false rejects at 1 % false accepts | per turn | on disk |
| -------------------------- | ---------------------------------- | -------- | ------- |
| `titanet-small` (default)  | 4.8 %                              | 47 ms    | 40 MB   |
| `3dspeaker-campplus-zh-en` | 4.3 %                              | 62 ms    | 28 MB   |
| `3dspeaker-eres2net`       | 4.1 %                              | 165 ms   | 26 MB   |

Each comes with its threshold; `voices.threshold` overrides it. Not measured yet: a Raspberry Pi,
real satellite microphones, voices of one family.

### Teaching Nestor a voice

Nobody is recognised without agreeing to it. Nestor keeps a voiceprint, never the recording, and
anyone can erase theirs.

- **In the admin**, on the person's page, **Record my voice**: say what is kept, check the
  microphone, read five sentences, try it. A person records their own voice; an owner records it for
  someone without an account (a child, a grandparent), who agrees in person. Browsers only open the
  microphone on a secure page: reach the admin over https, or on the machine itself (localhost).
- **On a satellite**: "learn to recognise my voice". Nestor asks who it is, has that person confirm
  in writing on their own account, then asks them to repeat five sentences aloud. It is the best
  place to do it: the microphone and the distance are the real ones.

### Getting better over time

A voice recorded once drifts: a cold, a tired evening, another room. Each clear turn, recognised with
a margin and long enough, adds to it, at most 50 voiceprints, at most 20 from one room. The recording
keeps a fixed share of every score, so learning cannot wander away from it. A name said only teaches
nothing, and saying who really spoke ("no, it's Léa") takes back what the mistaken turn taught.

The person's page shows what was learned, with a switch to stop learning, **Forget what was learned**
(the recording stays) and **Forget my voice**.

## Sensitive actions

A voice or a name tells who speaks; only an account vouches for them. Actions that matter are
confirmed by the person who asks:

- on their account, in the conversation: the agent says exactly what it will do and waits for yes;
- asked aloud on a satellite, in writing on their account ("Open the garage?"). Once they answer,
  it runs in their name, in the room where it was asked, and the room hears it is done. Without an
  answer within five minutes, nothing happens.

It stays rare: lights, heating, messages and reminders are never confirmed. For Home Assistant, whose
tools drive lights and locks alike, say which calls are sensitive by what they act on:

```yaml
tools:
  - kind: mcp
    name: home
    url: ${HOME_ASSISTANT_MCP_URL}
    token: ${HOME_ASSISTANT_TOKEN}
    sensitive:
      - tool: intent__HassTurnOn
        arguments: &doors
          domain: [lock, alarm_control_panel]
          device_class: [garage, gate, door]
          name: [lock, alarm, garage, gate, door]
      - tool: intent__HassTurnOff
        arguments: *doors
```

A value matches when it appears in the argument, ignoring case. A call that names neither the class
nor a matching device goes through unconfirmed: that is the limit of a rule on arguments.
