---

title: Contribuer et publier
description: Comment les changements arrivent dans les dépôts Nestor, et comment chacun publie ses versions.
---

Tous les dépôts de [nestor-home](https://github.com/nestor-home) suivent les mêmes règles, écrites
une fois dans le
[CONTRIBUTING](https://github.com/nestor-home/.github/blob/main/CONTRIBUTING.md) de
l’organisation. En bref :

- `main` est protégée : chaque changement passe par une pull request, fusionnée une fois sa
  vérification `ci` au vert.
- Les pull requests sont fusionnées en un seul commit, dont le message est leur titre : il suit les
  [Conventional Commits](https://www.conventionalcommits.org/) (`feat: …`, `fix: …`, `docs: …`).
  Un changement cassant ajoute `!` et s’explique dans la description.
- Une pull request est un changement cohérent, avec ses tests et sa documentation. Les tests
  vérifient un comportement réel, jamais une copie de l’implémentation.

Le `README.md` et l’`AGENTS.md` de chaque dépôt disent comment l’installer et lancer ses
vérifications.

## Versions

Personne ne pose d’étiquette à la main. Sur chaque dépôt, release-please garde ouverte une pull
request avec la prochaine version et son journal des modifications ; la fusionner étiquette la
version et la publie, dans la même exécution :

| Dépôt                                                                                     | Publié comme                                         |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [nestor](https://github.com/nestor-home/nestor)                                           | `nestor-home` sur PyPI, `ghcr.io/nestor-home/nestor` |
| [nestor-satellite-python](https://github.com/nestor-home/nestor-satellite-python)         | `nestor-satellite` sur PyPI                          |
| [nestor-satellite-typescript](https://github.com/nestor-home/nestor-satellite-typescript) | `@nestor-home/satellite` sur npm                     |
| [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust)             | `nestor-satellite` sur crates.io                     |
| [nestor-reachy](https://github.com/nestor-home/nestor-reachy)                             | `nestor-reachy` sur PyPI                             |
| [nestor-web](https://github.com/nestor-home/nestor-web)                                   | ce site                                              |

Les registres font confiance au workflow de publication du dépôt lui-même (trusted publishing) :
aucun jeton n’est stocké. Avant la 1.0, un `feat` ou un changement cassant monte la version mineure,
tout le reste le correctif.

## Signaler

Bugs et idées vont dans les issues du dépôt. Pour une vulnérabilité, suivez la
[politique de sécurité](https://github.com/nestor-home/.github/blob/main/SECURITY.md).

## Cette documentation

Elle vit dans [nestor-web](https://github.com/nestor-home/nestor-web), un fichier Markdown par page
et par langue sous `src/content/docs/`. Chaque page a un lien pour la modifier.
