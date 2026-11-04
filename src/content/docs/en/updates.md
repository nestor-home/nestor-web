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
version. It opens:

- the notes of each release since yours, breaking changes first;
- a warning when a release changes the data or the configuration;
- the satellites the new release no longer speaks to, if any;
- how to update, for the way Nestor is installed.

## Update the server

### Installed with uv or pip

Click **Update** in the dialog. Nestor installs the new version from PyPI into its own environment,
checks that it imports and that it accepts your configuration (`nestor check`), and puts the
previous version back if not. It then waits for you: click **Restart** when the household can spare
a minute. A conversation in progress is cut.

By hand, the same thing is:

```bash
uv tool upgrade nestor-home   # or: pip install -U nestor-home, in its environment
nestor check
```

then a restart.

### Installed with Docker

```bash
docker compose pull
docker compose up -d
```

A container cannot replace its own image. It would need the Docker socket, and the socket gives
whoever holds it root on the host: the admin will not ask for it.

### Breaking releases

Until the first stable release, a breaking release can change the data in place: its notes then
ask you to recreate `state/` (and to pair the satellites again). Read them before updating.

## Update a satellite

Each satellite says which software it runs and its version, shown on its page. A satellite allowed
`device.update` also looks for a newer version where it was installed from, once a day; its page
then shows **Update to** that version.

- The device fetches the version itself, from its own source. Nestor never sends it a file or an
  address, only the version the device reported.
- It installs it and starts again on it. If the new version does not connect within a minute, it
  goes back to the one it ran and says so.
- It never installs an older version, or one it did not find.

The rules are in the protocol ([Updates](/docs/satellites/protocol/#10-updates)). Update the server
first: a satellite on the previous protocol version keeps working while a release still speaks it.
