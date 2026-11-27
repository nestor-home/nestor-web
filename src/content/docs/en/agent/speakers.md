---

title: Speakers
description: How Nestor tells who is speaking on a satellite, recognises enrolled voices, and confirms sensitive actions.
---

A satellite belongs to a room, not a person.

## Who is speaking

| Source  | When                                      | Allows                                                                                             |
| ------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| account | Telegram, the admin: the channel signs in | everything the person may do                                                                       |
| voice   | a satellite, and the voice is enrolled    | personal answers, their own data read aloud                                                        |
| name    | the person says who they are              | personal answers; their own data is sent in writing                                                |
| unknown | a satellite, no voice recognised          | what anyone in the household may do: the home, timers, shared lists, messages signed with the room |

For a personal request ("remind me"), the agent asks who is speaking.

## Voice recognition

Recognition runs on the server, adding no delay. Install `nestor-home[voice-id]` and name a speaker
model (downloaded on first start); without one, satellite speakers are unknown.

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

Per turn on one CPU thread. `voices.threshold` overrides the model's threshold.

## Enrolling a voice

- **In the admin**: a person's page, **Record my voice**, read five sentences. Needs https or
  localhost. An owner can enrol someone without an account.
- **On a satellite**: say "learn to recognise my voice", confirm in writing, repeat five sentences.

Nestor keeps a voiceprint, never the audio, outside the journal: deleting it is final. Clearly
recognised turns add to it (up to 50 samples, 20 per room); correcting the speaker undoes a wrong
one. Their page offers
**Forget what was learned** and **Forget my voice**, or stops learning.

## Sensitive actions

A voice or a name never authorises anything: the person confirms on their account, in writing or
under **Ongoing** in the admin. Asked in a conversation on their account, Nestor asks right there,
and only their next message can confirm it, never the model by itself. It then runs where it was
asked; after five minutes without an answer, nothing happens.

By default, locks, the alarm, garages, gates and doors need it; lights, heating, messages and
alerts do not ([Home Assistant](/docs/home/#sensitive-actions)).
