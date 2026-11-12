---

title: Updates
description: How Nestor learns of a new release, what the admin shows, and how to update the server and its satellites.
---

Nestor tells you when a newer release is out and what it changes. You update the server from the
admin, or with Docker, and each satellite from its page.

## How Nestor learns of a release

Each release of Nestor publishes `releases.json`: every release, its changes, and the satellite
protocol versions it speaks. Nestor reads it a minute after it starts, then once a day. It only
reads it: nothing is installed, and nothing is sent but the request.

```yaml
updates:
  check: true # false: never read the release feed
```

`feed` is the feed's address, the latest GitHub release by default. Point it at a copy to update
from a mirror.

## What the admin shows

When a newer release is out, **New release** appears at the bottom of the sidebar, with its
version. It opens the notes of each release since yours (breaking changes first, with the satellites
the new release no longer speaks to), then how to update this installation.

## Update the server

Installed with `uv tool` or pip, Nestor updates itself: click **Install**, then confirm. It installs
the release from PyPI into its own environment with the extras you use, checks it with
`nestor check`, then restarts on it. If either step fails, it puts the previous version back and
says so. A conversation in progress is cut by the restart.

Elsewhere, the dialog gives the commands for the way Nestor is installed. With Docker:

```bash
docker compose pull
docker compose up -d
```

A container cannot replace its own image, and the admin never asks for the Docker socket, which
would give it root on the host. A development checkout updates with git.

Until the first stable release, a breaking release can change the data in place: its notes then ask
you to recreate `state/` and to pair the satellites again.

## Update a satellite

A satellite allowed `device.update` looks for a newer version where it was installed from, once a
day. Its page then shows **Update available** at the top. The button opens what that version
changes (the release notes the device found, when it found some) and what happens next.

- The device fetches the version itself. Nestor sends it only the version it reported, never a
  file or an address, and never opens the notes' address itself.
- It installs it and starts again on it. If the new version does not connect within a minute, it
  goes back to the one it ran and says so.
- It never installs an older version, or one it did not find.

The rules are in the protocol ([Updates](/docs/satellites/protocol/#10-updates)). Update the server
first: a satellite on the previous protocol version keeps working while a release still speaks it.
