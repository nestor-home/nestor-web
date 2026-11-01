---

title: Templates
description: Start a satellite from a repository that already pairs, passes the conformance suite and releases.
---

> Coming soon: the template repositories exist but are still empty. Until they are filled, start
> from an SDK’s minimal driver.

Each language will have a template repository: a satellite that pairs, runs the
[conformance suite](/docs/satellites/conformance/) in CI and publishes its releases.

| Language   | Template                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Python     | [nestor-satellite-template-python](https://github.com/nestor-home/nestor-satellite-template-python)         |
| TypeScript | [nestor-satellite-template-typescript](https://github.com/nestor-home/nestor-satellite-template-typescript) |
| Rust       | [nestor-satellite-template-rust](https://github.com/nestor-home/nestor-satellite-template-rust)             |

## Use one

1. On the template’s GitHub page, choose **Use this template**, then **Create a new repository**.
2. Give your device its identity: its id, model and room in the manifest, and the capabilities it
   really has.
3. Write its body: what it does with an attitude, an expression or a request to identify itself.
4. Plug its microphone and speaker, and its screen or camera if it has one.
5. Rename the package and fill in its metadata before the first release.
