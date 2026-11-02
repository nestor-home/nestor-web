---

title: Install
description: The server with uv, pip or Docker; where each keeps its configuration, and how to upgrade.
---

The server is the Python package [`nestor-home`](https://pypi.org/project/nestor-home/) (Python
3.12 or later), also published as the image `ghcr.io/nestor-home/nestor` (amd64, arm64). The three
ways run the same server:

| Install with                 | uv                                                       | pip                                          | Docker                                  |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| What you get                 | `nestor` on your `PATH`, in its own environment          | `nestor` in a virtual environment you manage | the image, with `docker run` or Compose |
| Python                       | uv fetches it if needed                                  | yours, 3.12 or later                         | inside the image                        |
| Configuration, `.env`, state | the folder where you ran `nestor init`                   | the folder where you ran `nestor init`       | the folder mounted on `/data`           |
| Upgrade                      | `uv tool upgrade nestor-home`                            | `pip install -U nestor-home`                 | `docker pull`, then a new container     |
| Good for                     | a development machine, trying it out, writing satellites | an environment you already run               | a server at home that stays on          |

The package alone runs Nestor in text: the admin, Telegram, connectors, any OpenAI-compatible
model, and satellites in writing. Their realtime voice is the `voice` extra: install
`'nestor-home[voice]'` to add it. The image has every extra. A configuration that gives satellites a
voice without the extra fails at start and names the command to run.

## With uv

[uv](https://docs.astral.sh/uv/) installs `nestor` as a tool: an isolated environment, the command
on your `PATH`, nothing to activate.

```bash
uv tool install nestor-home
mkdir nestor && cd nestor
nestor init
```

With the satellites’ voice, the first line is `uv tool install 'nestor-home[voice]'`, and
`nestor init` asks whether to use it. Fill the keys left empty in `.env` (see
[Providers](/docs/providers/)), then:

```bash
nestor check
nestor run
```

`nestor` reads `nestor.yaml` in the current folder; `nestor -c <file>` reads another, from
anywhere. It also reads the `.env` next to that file at each start, so there is nothing to source. A variable
already set in the environment (the shell, a service manager) wins over the file.

To upgrade, extras included:

```bash
uv tool upgrade nestor-home
```

## With pip

In a virtual environment you create and keep:

```bash
python3 -m venv ~/.venvs/nestor
~/.venvs/nestor/bin/pip install nestor-home
mkdir nestor && cd nestor
~/.venvs/nestor/bin/nestor init
```

Then `nestor check` and `nestor run` as above, from the environment (activate it, or call
`~/.venvs/nestor/bin/nestor`). For the satellites’ voice, install `'nestor-home[voice]'` instead. Upgrade
with the same command and `-U`.

## With Docker

The image `ghcr.io/nestor-home/nestor` keeps everything in `/data`. Mount a folder there, write a
first configuration, fill the keys, then start it:

```bash
docker run -it --rm -v ./nestor:/data ghcr.io/nestor-home/nestor init
$EDITOR nestor/.env
docker run -d --name nestor --restart unless-stopped -v ./nestor:/data -p 8470:8470 -p 8471:8471 ghcr.io/nestor-home/nestor
```

`nestor/` holds `nestor.yaml`, its `.env` and `state/`. The container starts as root only to give
`/data` to its user (uid 1000), then runs as that user. It publishes two ports: 8470 for the admin
(`http://<the machine’s address>:8470`) and 8471 for satellites, which pair and talk there.
To change them, set `admin.port` and the satellites channel’s `port` in `nestor.yaml`, and the
matching `-p` options.

Every `nestor` command runs through the image, which reads `/data/nestor.yaml`:

```bash
docker run --rm -v ./nestor:/data ghcr.io/nestor-home/nestor check
docker run --rm -it -v ./nestor:/data ghcr.io/nestor-home/nestor secrets list
```

Nestor reads `nestor/.env` itself, at each start: after editing it, `docker restart nestor`. A model
server on the same machine (Ollama, LM Studio) is `http://host.docker.internal:<port>/v1` from the
container; on Linux, add `--add-host host.docker.internal:host-gateway` to `docker run`.

### With Compose

For an installation that stays, the repository’s
[`compose.yaml`](https://github.com/nestor-home/nestor/blob/main/compose.yaml) holds the same
settings (the `host.docker.internal` line included) and an optional Litestream replica. It keeps
everything in `./data`:

```bash
curl -fsSLO https://raw.githubusercontent.com/nestor-home/nestor/main/compose.yaml
docker compose run --rm nestor init
docker compose up -d
```

To upgrade:

```bash
docker compose pull
docker compose up -d
```

`compose.yaml` follows `latest`. To stay on a release line, set the tag in it, for example
`ghcr.io/nestor-home/nestor:0.6` (or `0.6.0` for one exact release).

## The owner account

`nestor init` creates it. For an installation that has none yet (a configuration written by hand,
a `state/` from elsewhere):

```bash
nestor accounts create-owner --login alex
```

It asks for the password. `--person` names the household member it belongs to (by default the
first one of the configuration). Restart Nestor if it is running. With Docker, the same command
runs as `docker run --rm -it -v ./nestor:/data ghcr.io/nestor-home/nestor accounts create-owner --login alex`.
