---

title: Start
description: Run a Nestor server, create the owner account and open the admin.
---

Nestor is an open-source assistant for the whole household. One agent knows who is home, remembers
each person, drives Home Assistant and speaks up when something matters. You run its server on a
machine that stays on; speakers, tablets and robots pair with it as [satellites](/docs/satellites/).

Nestor is an early project: expect changes between releases.

## Run the server

The server is the Python package [`nestor-home`](https://pypi.org/project/nestor-home/) (Python
3.12 or later), also published as the image `ghcr.io/nestor-home/nestor` (amd64, arm64).

### With uv or pip

```bash
uv tool install 'nestor-home[voice]'
# or
pip install 'nestor-home[voice]'
```

The `voice` extra is the realtime voice channel satellites connect to. In an empty folder:

```bash
nestor init
```

It asks for the assistant’s name, your first name, a login and a password (10 characters or more),
then writes `nestor.yaml`, its secrets in `.env` (readable by you only) and `state/`, which holds
the owner account. It never overwrites a file.

Fill the two keys of `.env`: `OPENROUTER_API_KEY` for the model (any OpenAI-compatible endpoint,
set in `nestor.yaml`) and `ELEVENLABS_API_KEY` for the voice. Keep `NESTOR_SECRET_KEY` as written:
it opens the vault of secrets. Then:

```bash
nestor check   # validates the configuration and builds the adapters
nestor run
```

`nestor` reads `nestor.yaml` in the current folder; `nestor -c <file>` reads another. It also reads
the `.env` next to that file, so there is nothing to source. A variable already set in the
environment wins over the file.

### With Docker

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

The container runs as user 1000 and takes ownership of `data` when it starts. Port 8080 is the
admin, port 7860 the voice server satellites pair with.

## The owner account

`nestor init` creates it. For an installation that has none yet (a configuration written by hand,
a `state/` from elsewhere):

```bash
nestor accounts create-owner --login alex
```

It asks for the password. `--person` names the household member it belongs to (by default the
first one of the configuration). Restart Nestor if it is running. With Docker, the same command
runs as `docker compose run --rm nestor accounts create-owner --login alex`.

## Open the admin

Go to [http://localhost:8080](http://localhost:8080), or the machine’s address on port 8080, and
sign in with the owner’s login. The admin holds the configuration, the household, the satellites
and the journal of everything Nestor did.

## Next

- Pair a first device: [Satellites](/docs/satellites/).
- Write your own: the SDKs for [Python](/docs/sdks/python/), [TypeScript](/docs/sdks/typescript/)
  and [Rust](/docs/sdks/rust/).
