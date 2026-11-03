---

title: Templates
description: Start a satellite from a repository that already pairs, passes the conformance suite and releases.
---

Each template is a working satellite with a microphone, a speaker and a status light. It pairs,
runs the [conformance suite](/docs/satellites/conformance/) in CI and prepares its releases.
Replace the light with your hardware.

| Language   | Template                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Python     | [nestor-satellite-template-python](https://github.com/nestor-home/nestor-satellite-template-python)         |
| TypeScript | [nestor-satellite-template-typescript](https://github.com/nestor-home/nestor-satellite-template-typescript) |
| Rust       | [nestor-satellite-template-rust](https://github.com/nestor-home/nestor-satellite-template-rust)             |

## Use one

1. On the template’s GitHub page, choose **Use this template**, or:

   ```bash
   gh repo create my-satellite --template nestor-home/nestor-satellite-template-python --public --clone
   ```

2. Rename `my-satellite` (`my_satellite` in Python); the README lists where.
3. Plug in your hardware where the code says `TODO(hardware)`. Declare only what the device has.

## Run it against your Nestor

Make an enrollment code on the server, or in the admin under **Satellites**:

```bash
nestor satellites add --room salon --name "Living room speaker"
```

Give the pairing URI it prints to the device:

```bash
# Python
uv run my-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# TypeScript
pnpm build && pnpm start run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# Rust
cargo run -- run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
```

Later runs need only `--core` and `--room`.

## Test it

Each template runs the conformance suite against its own command, at the server version in
`.nestor-version`:

| Language   | Checks and conformance                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Python     | `uv run ruff check && uv run ruff format --check && uv run ty check && uv run pytest` |
| TypeScript | `pnpm lint && pnpm typecheck && pnpm test && pnpm conformance`                        |
| Rust       | `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test`        |

CI runs the same on every pull request and ends with one `ci` job to require in your branch rules.

## Release it

release-please turns Conventional Commits titles into a release pull request. Publishing ships
commented out: register a trusted publisher on PyPI, npm or crates.io, then enable the publish job.
The README gives the steps.
