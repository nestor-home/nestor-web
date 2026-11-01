---

title: Templates
description: Start a satellite from a repository that already pairs, passes the conformance suite and releases.
---

Each language has a template repository: a working satellite with a microphone, a speaker and a
status light, on that language’s SDK. It pairs, runs the
[conformance suite](/docs/satellites/conformance/) in CI and prepares its releases. Replace the
light with your hardware and keep the rest.

| Language   | Template                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Python     | [nestor-satellite-template-python](https://github.com/nestor-home/nestor-satellite-template-python)         |
| TypeScript | [nestor-satellite-template-typescript](https://github.com/nestor-home/nestor-satellite-template-typescript) |
| Rust       | [nestor-satellite-template-rust](https://github.com/nestor-home/nestor-satellite-template-rust)             |

## Use one

1. On the template’s GitHub page, choose **Use this template**, then **Create a new repository**.
   Or with the GitHub CLI:

   ```bash
   gh repo create my-satellite --template nestor-home/nestor-satellite-template-python --public --clone
   ```

2. Rename it. The package, the command and the model id are all spelled `my-satellite` (and
   `my_satellite` for the Python module); the README lists where.
3. Plug its hardware where the code says `TODO(hardware)`: the body (a printed light, to replace),
   the microphone and the speaker, and the capabilities in the manifest. Declare only what the
   device has.

## Run it against your Nestor

On the server, make an enrollment code (or in the admin: **Satellites**, then **Add**):

```bash
nestor satellites add --room salon --name "Living room speaker"
```

It prints a pairing URI. Give it to the device on its first run:

```bash
# Python
uv run my-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:7860/?code=K7QF2M9X'
# TypeScript
pnpm build && pnpm start run --room salon --pairing-uri 'nestor+http://nestor.local:7860/?code=K7QF2M9X'
# Rust
cargo run -- run --room salon --pairing-uri 'nestor+http://nestor.local:7860/?code=K7QF2M9X'
```

It keeps its token in `~/.config/my-satellite/<id>.json`; later runs only need `--core` and
`--room`. Without a pairing URI, it says a device code on its speaker and logs it: type it in the
admin.

## Test it

Each template runs the server’s conformance suite through uvx, at the server version pinned in
`.nestor-version`, against its own command without a sound card:

| Language   | Checks and conformance                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Python     | `uv run ruff check && uv run ruff format --check && uv run ty check && uv run pytest` |
| TypeScript | `pnpm lint && pnpm typecheck && pnpm test && pnpm conformance`                        |
| Rust       | `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test`        |

CI runs the same on every pull request, and ends with a single `ci` job to require in your branch
rules.

## Release it

Pull request titles follow Conventional Commits, and release-please turns them into a release pull
request with the next version and the changelog. Publishing is left commented out: in your
repository, register a trusted publisher on PyPI, npm or crates.io, then enable the publish job.
Each template’s README gives the steps.
