---

title: Contributing and releases
description: How changes reach the Nestor repositories, and how each one is released.
---

Every repository of [nestor-home](https://github.com/nestor-home) follows the same rules, written
once in the organization’s
[CONTRIBUTING](https://github.com/nestor-home/.github/blob/main/CONTRIBUTING.md). In short:

- `main` is protected: every change is a pull request, merged once its `ci` check is green.
- Pull requests are squash-merged, and their title becomes the commit, so it follows
  [Conventional Commits](https://www.conventionalcommits.org/): `feat: …`, `fix: …`, `docs: …`.
  A breaking change adds `!` and says why in the body.
- One pull request is one coherent change, with its tests and documentation. Tests check real
  behaviour, never a copy of the implementation.

Each repository’s `README.md` and `AGENTS.md` say how to set it up and run its checks.

## Releases

Nobody tags by hand. On each repository, release-please keeps a pull request open with the next
version and its changelog; merging it tags the release and publishes it, in the same run:

| Repository                                                                                | Published as                                        |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [nestor](https://github.com/nestor-home/nestor)                                           | `nestor-home` on PyPI, `ghcr.io/nestor-home/nestor` |
| [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python)         | `nestor-satellite` on PyPI                          |
| [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript) | `@nestor-home/satellite` on npm                     |
| [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust)             | `nestor-satellite` on crates.io                     |
| [nestor-reachy](https://github.com/nestor-home/nestor-reachy)                             | `nestor-reachy` on PyPI                             |
| [nestor-web](https://github.com/nestor-home/nestor-web)                                   | this site                                           |

Registries trust the repository’s own release workflow (trusted publishing): no token is stored.
Before 1.0, a `feat` or a breaking change raises the minor version, anything else the patch.

## Reporting

Bugs and ideas go to the repository’s issues. For a vulnerability, follow the
[security policy](https://github.com/nestor-home/.github/blob/main/SECURITY.md).

## This documentation

It lives in [nestor-web](https://github.com/nestor-home/nestor-web), one Markdown file per page
and language under `src/content/docs/`. Every page has a link to edit it.
