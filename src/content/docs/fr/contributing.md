---

title: Contribuer et publier
description: Comment les changements arrivent dans les dépôts Nestor, et comment chacun publie ses versions.
---

Tous les dépôts de [nestor-home](https://github.com/nestor-home) suivent le
[CONTRIBUTING](https://github.com/nestor-home/.github/blob/main/CONTRIBUTING.md) de l’organisation :

- Chaque changement passe par une pull request, fusionnée quand sa vérification `ci` est au vert.
- Le titre devient le commit fusionné : il suit les
  [Conventional Commits](https://www.conventionalcommits.org/) (`feat: …`, `fix: …`). Un
  changement cassant ajoute `!`.
- Une pull request est un seul changement, avec ses tests et sa documentation. Les tests vérifient
  un comportement réel.

Le `README.md` et l’`AGENTS.md` de chaque dépôt expliquent son installation et ses vérifications.

## Versions

release-please garde ouverte une pull request avec la prochaine version et son journal des
modifications. La fusionner étiquette et publie la version :

| Dépôt                                                                                     | Publié sous                                                  |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [nestor](https://github.com/nestor-home/nestor)                                           | `nestor-home` sur PyPI, `ghcr.io/nestor-home/nestor`         |
| [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python)         | `nestor-satellite` sur PyPI                                  |
| [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript) | `@nestor-home/satellite` sur npm                             |
| [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust)             | `nestor-satellite` sur crates.io, sa CLI sur GitHub Releases |
| [nestor-reachy](https://github.com/nestor-home/nestor-reachy)                             | `nestor-reachy` sur PyPI                                     |
| [nestor-character](https://github.com/nestor-home/nestor-character)                       | `@nestor-home/character` sur npm                             |
| [nestor-web](https://github.com/nestor-home/nestor-web)                                   | ce site                                                      |

Avant la 1.0, un `feat` ou un changement cassant monte la version mineure, tout le reste le
correctif.

## Signaler

Questions et idées vont dans les [Discussions](https://github.com/orgs/nestor-home/discussions),
les bugs reproductibles dans les issues du dépôt. Pour une vulnérabilité, suivez la
[politique de sécurité](https://github.com/nestor-home/.github/blob/main/SECURITY.md).

## Cette documentation

Chaque page est un fichier Markdown de [nestor-web](https://github.com/nestor-home/nestor-web),
sous `src/content/docs/`, avec un lien pour la modifier.
