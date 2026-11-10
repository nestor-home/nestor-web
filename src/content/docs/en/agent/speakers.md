---

title: Speakers
description: How Nestor tells who is speaking on a satellite, recognises enrolled voices, and confirms sensitive actions.
---

A satellite belongs to a room, not to a person: anyone in the room can talk to it. Nestor identifies
the speaker on each turn.

## How the speaker is identified

| Source  | When                                      | Allows                                              |
| ------- | ----------------------------------------- | --------------------------------------------------- |
| account | Telegram, the admin: the channel signs in | everything the person may do                        |
| voice   | a satellite, and the voice is enrolled    | personal answers, their own data read aloud         |
| name    | the person says who they are              | personal answers; their own data is sent in writing |
| unknown | a satellite, no voice recognised          | what anyone in the household may do                 |

An unknown speaker can control the home, set timers, use shared lists and pass on messages. A
message passed on this way is signed with the room it came from.

When the answer depends on the person ("remind me", "my appointment"), the agent asks who is speaking
and records the answer for the rest of the conversation. A different recognised voice cancels it.

## Voice recognition

Voices are recognised on the server, from the audio the satellites already send. Recognition runs
while the speech is transcribed, so it adds no delay to the turn. Without a speaker model, every
satellite speaker is unknown.

```yaml
models:
  ears:
    type: speaker
    provider: sherpa-onnx
    model: titanet-small

voices:
  embedder: ears
```

Install the extra with `pip install 'nestor-home[voice-id]'`. The model downloads on first start.
Measured with `nestor bench run speaker-id`, on one CPU thread:

| `model`                    | false rejects at 1 % false accepts | per turn | size  |
| -------------------------- | ---------------------------------- | -------- | ----- |
| `titanet-small` (default)  | 4.8 %                              | 47 ms    | 40 MB |
| `3dspeaker-campplus-zh-en` | 4.3 %                              | 62 ms    | 28 MB |
| `3dspeaker-eres2net`       | 4.1 %                              | 165 ms   | 26 MB |

Each model has its own threshold; `voices.threshold` overrides it.

### Enrolling a voice

- **In the admin**: on a person's page, **Record my voice**. The person reads five sentences. An
  owner can record the voice of someone without an account. The browser needs a secure page: https,
  or localhost.
- **On a satellite**: say "learn to recognise my voice". The person confirms in writing on their own
  account, then repeats five sentences aloud.

Nestor keeps a voiceprint, never the audio. Voiceprints are stored outside the journal, so deleting
one removes it completely.

### Learning over time

Each turn recognised with a clear margin is added to the person's voice, up to 50 samples (20 per
room). The enrolled recording always keeps a fixed weight in the score. A name alone teaches nothing,
and correcting the speaker removes what the wrong turn taught.

The person's page in the admin shows what was learned, with a switch to stop learning,
**Forget what was learned** and **Forget my voice**.

## Sensitive actions

A recognised voice or a name never authorises anything. Sensitive actions are confirmed by the
person who asks:

- on their own account, in the conversation;
- asked aloud on a satellite, in writing on their account. The action runs once they confirm, in the
  room where it was asked. Without an answer within five minutes, nothing happens.

Lights, heating, messages and reminders need no confirmation. For Home Assistant, `sensitive` says
what does, whatever the action; by default, locks, the alarm, garages, gates and doors:

```yaml
home:
  kind: home-assistant
  url: ${HOME_ASSISTANT_URL}
  token: ${HOME_ASSISTANT_TOKEN}
  sensitive:
    domains: [lock, alarm_control_panel]
    device_classes: [garage, gate, door]
    names: [lock, alarm, garage, gate, door]
```

An action is sensitive when one of these values appears in its domain, device class or name, ignoring
case. The person answers in the conversation, or on the admin's **Messages** page.
