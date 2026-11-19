---

title: Cameras and calls
description: Watch what a satellite films, take a picture, call through a satellite, and set when its camera stays off.
---

A satellite allowed `video.capture` can be watched from the admin. One that hears and plays sound
can be called: you talk through it and hear the room, with its video when it films.

## Watch, take a picture, call

Open a room in **Today** or **The house**. Each satellite there has **View**, **Picture** and
**Call**.

- Nothing leaves a device outside a session a person opened.
- The device connects to the server only, which relays to your browser.
- The device shows that it films or is in a call, when it has a light or a screen.
- During a call, the assistant does not listen to that room.
- Each session and picture goes in the [journal](/docs/agent/journal/). Pictures are kept 7 days.

## Requirements

| Needs                                | Why                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------- |
| the `media` extra                    | `pip install 'nestor-home[media]'` on the server                        |
| TLS (`wss`)                          | a satellite films only over TLS, unless it runs on the server’s machine |
| `video.capture`                      | to watch and take pictures                                              |
| `audio.capture` and `audio.playback` | to call                                                                 |

## Who may watch and call

| Who             | Scopes                             | Uses                            |
| --------------- | ---------------------------------- | ------------------------------- |
| owners          | `media.view.all`, `media.call.all` | every device                    |
| admins, members | `media.view`, `media.call`         | only the devices that list them |

Set who may watch or call on each satellite’s page, under **Watching and calling**. Roles are in
[Configuration](/docs/configuration/#the-admin).

## The assistant looks too

Asked in writing from a person’s own account (“is the light on in the living room?”), the
assistant takes a picture with the `look` tool and looks at it. It does so only when that person
may see the room and its model sees images.

Asked aloud, it asks the person to write from their account: a voice does not prove who speaks.

## Privacy

With no rule, a camera films whenever someone allowed asks. On each satellite’s page, next to who
may watch, you can add:

| Rule                      | Turns the camera off…                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| quiet hours               | in time slots, in the household’s time, on the days you pick; a slot may run past midnight (22:00 to 07:00)                                         |
| off while someone is home | while anyone in the household, or the people you pick, is home, as [Home Assistant](/docs/home/) sees it; when it cannot tell, the camera stays off |

A rule applies to live views, pictures, the video of a call and `look`. It ends a session it no
longer allows, a call through that device included, and the journal says why.

## For device makers

The rules a device follows for sessions (M1 to M7) are in the
[protocol](/docs/satellites/protocol/#91-sessions).
