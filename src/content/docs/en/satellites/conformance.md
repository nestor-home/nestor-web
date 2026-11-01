---

title: Conformance
description: Check a satellite, written in any language, against the protocol from the command line.
---

The server ships a black-box conformance suite. A fake core, made of the real pairing service and
the real gateway, launches your satellite once per scenario and checks what it does: pairing with a
device code and with an enrollment code, refused codes, rate limits, identify, `hello`, acks, audio
both ways and reconnection. Each check names the [protocol](/docs/satellites/protocol/) rule it
proves.

## Run it

The suite needs the server’s `voice` extra; uvx runs it without installing anything:

```bash
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance [--deadline SECONDS] -- <command>
```

`<version>` is a server release from 0.1.0 on. Everything after `--` is your satellite’s command
line, in which:

- `{url}` becomes the fake core’s address;
- `{state}` becomes a fresh folder, for the token and anything the satellite keeps.

The scenarios with an enrollment code give it in `NESTOR_PAIRING_URI`, the way a person configures
a headless device; the variable is removed in the other scenarios. Your satellite must read it (rule
P1). `--deadline` is how many seconds the satellite has for each step (15 by default).

The SDKs' own commands, with no sound card:

```bash
# TypeScript, from a project where @nestor-home/satellite and @roamhq/wrtc are installed
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  npx nestor-satellite run --core {url} --room salon --input none --output none --token-file {state}/token.json

# Rust
uvx --from 'nestor-home[voice]==<version>' nestor satellites conformance -- \
  nestor-satellite run --core {url} --room salon --null-audio --token-file {state}/token.json
```

## Output

One line per check, then a summary. What the satellite itself prints (its log) comes in between.

```text
PASS  asks to pair
PASS  declares enrollment.provisioning (P1)
PASS  claims its token once its device code is typed (P2)
PASS  connects with its token (W1)
FAIL  acknowledges intent.behavior within 1 s (no ack with this intent's id)
...
1 check failed out of 32
```

The command speaks the language of `LC_ALL`, `LC_MESSAGES` or `LANG` (English or French).

| Exit status | Means                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| `0`         | the satellite conforms                                                              |
| `1`         | a check failed                                                                      |
| `2`         | the command cannot run: none given, program not found, or the `voice` extra missing |

## In CI

Run the same command in a job of your repository, after building the satellite. It needs Python
(uv installs it) and nothing from the Nestor repository. Pin the server release, and raise it when
you move to a new version of the protocol.

In Python, the suite is also a function: `check_satellite(driver)` from
`nestor.adapters.channels.voice.satellites.conformance` takes a coroutine function or a command,
and returns the findings for your own test.
