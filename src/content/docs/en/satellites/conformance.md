---

title: Conformance
description: Check a satellite, written in any language, against the protocol from the command line.
---

A black-box suite runs your satellite once per scenario against a fake core (the real pairing and
gateway). Each check names its [protocol rule](/docs/satellites/protocol/#12-conformance).

## Run it

Nothing to install; without the `voice` extra, audio checks fail.

```bash
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance [--deadline SECONDS] -- <command>
```

| Part         | What it is                                                                            |
| ------------ | ------------------------------------------------------------------------------------- |
| `<version>`  | a server release                                                                      |
| `<command>`  | your satellite’s command line, after `--`                                             |
| `{url}`      | in the command, replaced by the fake core’s address                                   |
| `{state}`    | in the command, replaced by a fresh folder for the token and what the satellite keeps |
| `--deadline` | seconds allowed per step, 15 by default                                               |

Enrollment scenarios set `NESTOR_PAIRING_URI` (rule P1); the others unset it. The SDKs, without a
sound card:

```bash
# TypeScript, from a project where @nestor-home/satellite and @roamhq/wrtc are installed
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  npx nestor-satellite run --core {url} --room salon --input none --output none --token-file {state}/token.json

# Rust
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  nestor-satellite run --core {url} --room salon --null-audio --token-file {state}/token.json
```

## Output

One line per check, then a summary, in English or French (`LC_ALL`, `LC_MESSAGES`, `LANG`).

```text
PASS  asks to pair
PASS  declares enrollment.provisioning (P1)
PASS  claims its token once its device code is typed (P2)
PASS  opens its link with its token, a hello first, as the paired device (L1)
FAIL  acknowledges intent.behavior within 1 s (no ack with this intent's id)
...
1 check failed out of 32
```

| Exit status | Means                                                    |
| ----------- | -------------------------------------------------------- |
| `0`         | the satellite conforms                                   |
| `1`         | a check failed                                           |
| `2`         | the command cannot run: none given, or program not found |

## In CI

Run the same command after the build; it needs only uv. Pin the server release.

In Python tests, `check_satellite(driver)` (`nestor.adapters.channels.satellites.conformance`) returns
the findings; `driver` is a command or a coroutine function taking a `Launch`.
