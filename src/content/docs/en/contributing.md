---

title: Contributing and releases
description: How changes reach the Nestor repositories, and how each one is released.
---

Every [nestor-home](https://github.com/nestor-home) repository follows the organization’s
[CONTRIBUTING](https://github.com/nestor-home/.github/blob/main/CONTRIBUTING.md):

- Every change is a pull request, merged once its `ci` check is green.
- The title becomes the squashed commit, so it follows
  [Conventional Commits](https://www.conventionalcommits.org/): `feat: …`, `fix: …`. A breaking
  change adds `!`.
- One pull request is one change, with its tests and documentation. Tests check real behaviour.

Each repository’s `README.md` and `AGENTS.md` explain its setup and checks.

## Releases

release-please keeps a pull request open with the next version and its changelog. Merging it tags
and publishes the release:

| Repository                                                                                | Published as                                                |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [nestor](https://github.com/nestor-home/nestor)                                           | `nestor-home` on PyPI, `ghcr.io/nestor-home/nestor`         |
| [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python)         | `nestor-satellite` on PyPI                                  |
| [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript) | `@nestor-home/satellite` on npm                             |
| [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust)             | `nestor-satellite` on crates.io, its CLI on GitHub Releases |
| [nestor-reachy](https://github.com/nestor-home/nestor-reachy)                             | `nestor-reachy` on PyPI                                     |
| [nestor-character](https://github.com/nestor-home/nestor-character)                       | `@nestor-home/character` on npm                             |
| [nestor-web](https://github.com/nestor-home/nestor-web)                                   | this site                                                   |

Before 1.0, a `feat` or a breaking change raises the minor version, anything else the patch.

## Reporting

Questions and ideas go to [Discussions](https://github.com/orgs/nestor-home/discussions),
reproducible bugs to the repository’s issues. For a vulnerability, follow the
[security policy](https://github.com/nestor-home/.github/blob/main/SECURITY.md).

## This documentation

Each page is a Markdown file in [nestor-web](https://github.com/nestor-home/nestor-web), under
`src/content/docs/`, with a link to edit it.
