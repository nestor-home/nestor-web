---

title: Conformance
description: Check a satellite, written in any language, against the protocol from the command line.
---

The server’s black-box suite runs your satellite, in any language, once per scenario against a fake
core made of the real pairing service and gateway. Each check names the
[protocol rule](/docs/satellites/protocol/#12-conformance) it proves.

## Run it

uvx runs the suite, with the server’s `voice` extra, without installing anything:

```bash
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance [--deadline SECONDS] -- <command>
```

`<version>` is a server release. After `--` comes your satellite’s command line, in which:

- `{url}` becomes the fake core’s address;
- `{state}` becomes a fresh folder, for the token and anything the satellite keeps.

Scenarios with an enrollment code give it in `NESTOR_PAIRING_URI` (rule P1); the others remove the
variable. `--deadline` is the seconds allowed per step (15 by default).

With the SDKs’ commands, without a sound card:

```bash
# TypeScript, from a project where @nestor-home/satellite and @roamhq/wrtc are installed
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  npx nestor-satellite run --core {url} --room salon --input none --output none --token-file {state}/token.json

# Rust
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  nestor-satellite run --core {url} --room salon --null-audio --token-file {state}/token.json
```

## Output

One line per check, then a summary, in the language of `LC_ALL`, `LC_MESSAGES` or `LANG` (English
or French).

```text
PASS  asks to pair
PASS  declares enrollment.provisioning (P1)
PASS  claims its token once its device code is typed (P2)
PASS  opens its link with its token (L1)
FAIL  acknowledges intent.behavior within 1 s (no ack with this intent's id)
...
1 check failed out of 32
```

| Exit status | Means                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| `0`         | the satellite conforms                                                              |
| `1`         | a check failed                                                                      |
| `2`         | the command cannot run: none given, program not found, or the `voice` extra missing |

## In CI

Run the same command in a job after building the satellite; it needs only uv. Pin the server
release and raise it with the protocol version.

In Python, `check_satellite(driver)` from `nestor.adapters.channels.satellites.conformance` returns
the findings for your own tests. `driver` is a coroutine function taking a `Launch`, or a command.
