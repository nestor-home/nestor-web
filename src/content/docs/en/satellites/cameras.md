---

title: Cameras and calls
description: Watch what a satellite films, take a picture, call through a satellite, and set when its camera stays off.
---

Watch a satellite that films from the admin, or call one that hears and plays sound.

## Watch, take a picture, call

Open a room in **Today** or **The house**: each satellite has **View**, **Picture** and **Call**.

- Nothing leaves a device outside a session a person opened.
- The server relays the device to your browser.
- A device with a light or screen shows it films or is in a call.
- During a call, the assistant does not listen to that room.
- Sessions and pictures go in the [journal](/docs/agent/journal/); pictures are kept 7 days.

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

Set it on each satellite’s page, under **Watching and calling**
([roles](/docs/configuration/#the-admin)).

## The assistant looks too

Asked in writing from a person’s account (“is the light on in the living room?”), the assistant
takes a picture with `look`, if that person may see the room and its model sees images. Asked aloud,
it asks the person to write instead: a voice does not prove who speaks.

## Privacy

With no rule, a camera films whenever someone allowed asks. Rules, on each satellite’s page:

| Rule                      | Turns the camera off…                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| quiet hours               | in time slots, in the household’s time, on the days you pick; a slot may run past midnight (22:00 to 07:00)                                         |
| off while someone is home | while anyone in the household, or the people you pick, is home, as [Home Assistant](/docs/home/) sees it; when it cannot tell, the camera stays off |

A rule covers views, pictures, call video and `look`, and ends a session it no longer allows; the
journal says why.

## For device makers

Session rules M1 to M7: [protocol](/docs/satellites/protocol/#91-sessions).
