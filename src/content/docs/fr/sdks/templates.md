---

title: Modèles
description: Partir d’un dépôt qui s’appaire déjà, passe la suite de conformité et publie ses versions.
---

Chaque modèle est un satellite qui marche, avec un micro, un haut-parleur et un voyant. Il
s’appaire, lance la [suite de conformité](/fr/docs/satellites/conformance/) en intégration continue
et prépare ses versions. Remplacez le voyant par votre matériel.

| Langage    | Modèle                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Python     | [nestor-satellite-template-python](https://github.com/nestor-home/nestor-satellite-template-python)         |
| TypeScript | [nestor-satellite-template-typescript](https://github.com/nestor-home/nestor-satellite-template-typescript) |
| Rust       | [nestor-satellite-template-rust](https://github.com/nestor-home/nestor-satellite-template-rust)             |

## S’en servir

1. Sur la page GitHub du modèle, choisissez **Use this template**, ou :

   ```bash
   gh repo create my-satellite --template nestor-home/nestor-satellite-template-python --public --clone
   ```

2. Renommez `my-satellite` (`my_satellite` en Python) ; le README dit où.
3. Branchez votre matériel là où le code dit `TODO(hardware)`. Ne déclarez que ce que l’appareil a.

## Le relier à votre Nestor

Créez un code d’enrôlement sur le serveur, ou dans l’administration sous **Satellites** :

```bash
nestor satellites add --room salon --name "Enceinte du salon"
```

Donnez à l’appareil l’URI d’appairage affichée :

```bash
# Python
uv run my-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# TypeScript
pnpm build && pnpm start run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# Rust
cargo run -- run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
```

Ensuite, `--core` et `--room` suffisent.

## Le tester

Chaque modèle lance la suite de conformité contre sa propre commande, à la version du serveur
indiquée dans `.nestor-version` :

| Langage    | Vérifications et conformité                                                           |
| ---------- | ------------------------------------------------------------------------------------- |
| Python     | `uv run ruff check && uv run ruff format --check && uv run ty check && uv run pytest` |
| TypeScript | `pnpm lint && pnpm typecheck && pnpm test && pnpm conformance`                        |
| Rust       | `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test`        |

L’intégration continue fait de même à chaque pull request et finit par un seul job `ci`, à exiger
dans vos règles de branche.

## Le publier

release-please tire des titres Conventional Commits une pull request de version. Son job appelle
un workflow partagé de nestor-home qui ne tourne que dans nestor-home : remplacez-le par le job
en commentaire juste dessous. La publication est aussi en commentaire : déclarez un éditeur de
confiance sur PyPI, npm ou crates.io, puis décommentez le job de publication. Le README donne les
étapes.
