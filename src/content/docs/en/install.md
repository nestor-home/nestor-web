---

title: Install
description: The server with uv, pip or Docker; where each keeps its configuration, and how to upgrade.
---

The server is the Python package [`nestor-home`](https://pypi.org/project/nestor-home/) (Python
3.12 or later), also published as the image `ghcr.io/nestor-home/nestor` (amd64, arm64). The three
ways run the same server:

| Install with                 | uv                                                       | pip                                          | Docker                               |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| What you get                 | `nestor` on your `PATH`, in its own environment          | `nestor` in a virtual environment you manage | the image, started by `compose.yaml` |
| Python                       | uv fetches it if needed                                  | yours, 3.12 or later                         | inside the image                     |
| Configuration, `.env`, state | the folder where you ran `nestor init`                   | the folder where you ran `nestor init`       | `./data`, next to `compose.yaml`     |
| Upgrade                      | `uv tool upgrade nestor-home`                            | `pip install -U 'nestor-home[voice]'`        | `docker compose pull`                |
| Good for                     | a development machine, trying it out, writing satellites | an environment you already run               | a server at home that stays on       |

Install the `voice` extra in every case: it is the realtime voice channel satellites connect to,
and today `nestor` does not start without it, even when the configuration has no voice channel.
The image already has it.

## With uv

[uv](https://docs.astral.sh/uv/) installs `nestor` as a tool: an isolated environment, the command
on your `PATH`, nothing to activate.

```bash
uv tool install 'nestor-home[voice]'
mkdir nestor && cd nestor
nestor init
```

Fill `.env` (see [Providers](/docs/providers/)), then:

```bash
nestor check
nestor run
```

`nestor` reads `nestor.yaml` in the current folder; `nestor -c <file>` reads another, from
anywhere. It also reads the `.env` next to that file, so there is nothing to source. A variable
already set in the environment (the shell, a service manager) wins over the file.

To upgrade, keeping the extra:

```bash
uv tool upgrade nestor-home
```

## With pip

In a virtual environment you create and keep:

```bash
python3 -m venv ~/.venvs/nestor
~/.venvs/nestor/bin/pip install 'nestor-home[voice]'
mkdir nestor && cd nestor
~/.venvs/nestor/bin/nestor init
```

Then `nestor check` and `nestor run` as above, from the environment (activate it, or call
`~/.venvs/nestor/bin/nestor`). Upgrade with `~/.venvs/nestor/bin/pip install -U 'nestor-home[voice]'`.

## With Docker

The repository’s [`compose.yaml`](https://github.com/nestor-home/nestor/blob/main/compose.yaml)
runs the published image, with everything it keeps in `./data`:

```bash
mkdir nestor && cd nestor
curl -fsSLO https://raw.githubusercontent.com/nestor-home/nestor/main/compose.yaml
docker compose pull
docker compose run --rm nestor init
$EDITOR data/.env
docker compose up -d
```

`data/` holds `nestor.yaml`, its `.env` and `state/`. The container starts as root only to give
`data` to its user (uid 1000), then runs as that user. Port 8080 is the admin, port 7860 the voice
server satellites pair with.

Every `nestor` command runs through the image, which reads `/data/nestor.yaml`:

```bash
docker compose run --rm nestor check
docker compose run --rm nestor secrets list
```

After changing `data/.env`, apply it with `docker compose up -d`: Compose also passes the file to
the container as its environment, and `docker compose restart` keeps the old values.

To upgrade:

```bash
docker compose pull
docker compose up -d
```

`compose.yaml` follows `latest`. To stay on a release line, set the tag in it, for example
`ghcr.io/nestor-home/nestor:0.3` (or `0.3.0` for one exact release).

## The owner account

`nestor init` creates it. For an installation that has none yet (a configuration written by hand,
a `state/` from elsewhere):

```bash
nestor accounts create-owner --login alex
```

It asks for the password. `--person` names the household member it belongs to (by default the
first one of the configuration). Restart Nestor if it is running. With Docker, the same command
runs as `docker compose run --rm nestor accounts create-owner --login alex`.
