---

title: Speakers
description: How Nestor tells who is speaking on a satellite, recognises enrolled voices, and confirms sensitive actions.
---

A satellite belongs to a room, not a person. On each turn, Nestor works out who is speaking and
what that allows.

## Who is speaking

| Source  | When                                      | Allows                                                                                             |
| ------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| account | Telegram, the admin: the channel signs in | everything the person may do                                                                       |
| voice   | a satellite, and the voice is enrolled    | personal answers, their own data read aloud                                                        |
| name    | the person says who they are              | personal answers; their own data is sent in writing                                                |
| unknown | a satellite, no voice recognised          | what anyone in the household may do: the home, timers, shared lists, messages signed with the room |

When the answer depends on the person ("remind me"), the agent asks who is speaking and keeps the
answer for the conversation, until a different voice is recognised.

## Voice recognition

Voices are recognised on the server, from the satellites' audio, while it is transcribed: no added
delay. Install `nestor-home[voice-id]` and name a speaker model; it downloads on first start.
Without one, every satellite speaker is unknown.

```yaml
models:
  ears:
    type: speaker
    provider: sherpa-onnx
    model: titanet-small

voices:
  embedder: ears
```

| `model`                    | false rejects at 1 % false accepts | per turn | size  |
| -------------------------- | ---------------------------------- | -------- | ----- |
| `titanet-small`            | 4.8 %                              | 47 ms    | 40 MB |
| `3dspeaker-campplus-zh-en` | 4.3 %                              | 62 ms    | 28 MB |
| `3dspeaker-eres2net`       | 4.1 %                              | 165 ms   | 26 MB |

Measured with `nestor bench run speaker-id` on one CPU thread. `voices.threshold` overrides each
model's own threshold.

## Enrolling a voice

- **In the admin**: on a person's page, **Record my voice**, then read five sentences. An owner can
  enrol someone without an account. The page must be https or localhost.
- **On a satellite**: say "learn to recognise my voice", confirm in writing on your account, then
  repeat five sentences.

Nestor keeps a voiceprint, never the audio, outside the journal: deleting it removes it for good.
Turns recognised with a clear margin add to it, up to 50 samples (20 per room); the enrolment keeps
a fixed weight, a name alone teaches nothing, and correcting the speaker undoes what a wrong turn taught. The person's page can
stop learning, **Forget what was learned** or **Forget my voice**.

## Sensitive actions

A voice or a name never authorises anything. The person who asks confirms a sensitive action on
their own account: in the conversation, or, when asked aloud, in writing or in the admin under
**Ongoing**. It then runs in the room where it was asked; without an answer in five minutes,
nothing happens.

Lights, heating, messages and reminders need no confirmation. Locks, the alarm, garages, gates and
doors do by default: see [Home Assistant](/docs/home/#sensitive-actions).
