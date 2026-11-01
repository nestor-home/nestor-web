---

title: Modèles
description: Partir d’un dépôt qui s’appaire déjà, passe la suite de conformité et publie ses versions.
---

Chaque langage a son dépôt modèle : un satellite qui marche, avec un micro, un haut-parleur et un
voyant, sur le SDK du langage. Il s’appaire, lance la
[suite de conformité](/fr/docs/satellites/conformance/) en intégration continue et prépare ses
versions. Remplacez le voyant par votre matériel et gardez le reste.

| Langage    | Modèle                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Python     | [nestor-satellite-template-python](https://github.com/nestor-home/nestor-satellite-template-python)         |
| TypeScript | [nestor-satellite-template-typescript](https://github.com/nestor-home/nestor-satellite-template-typescript) |
| Rust       | [nestor-satellite-template-rust](https://github.com/nestor-home/nestor-satellite-template-rust)             |

## S’en servir

1. Sur la page GitHub du modèle, choisissez **Use this template**, puis **Create a new repository**.
   Ou avec la CLI GitHub :

   ```bash
   gh repo create my-satellite --template nestor-home/nestor-satellite-template-python --public --clone
   ```

2. Renommez-le. Le paquet, la commande et l’identifiant de modèle s’écrivent tous `my-satellite`
   (et `my_satellite` pour le module Python) ; le README dit où.
3. Branchez son matériel là où le code dit `TODO(hardware)` : le corps (un voyant affiché dans le
   terminal, à remplacer), le micro et le haut-parleur, et les capacités du manifeste. Ne déclarez
   que ce que l’appareil a.

## Le relier à votre Nestor

Sur le serveur, créez un code d’enrôlement (ou dans l’administration : **Satellites**, puis **Ajouter**) :

```bash
nestor satellites add --room salon --name "Enceinte du salon"
```

La commande affiche une URI d’appairage. Donnez-la à l’appareil à son premier lancement :

```bash
# Python
uv run my-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:7860/?code=K7QF2M9X'
# TypeScript
pnpm build && pnpm start run --room salon --pairing-uri 'nestor+http://nestor.local:7860/?code=K7QF2M9X'
# Rust
cargo run -- run --room salon --pairing-uri 'nestor+http://nestor.local:7860/?code=K7QF2M9X'
```

Il garde son jeton dans `~/.config/my-satellite/<id>.json` ; ensuite, `--core` et `--room`
suffisent. Sans URI d’appairage, il dit un code d’appareil sur son haut-parleur et l’écrit dans son
journal : tapez-le dans l’administration.

## Le tester

Chaque modèle lance la suite de conformité du serveur avec uvx, à la version épinglée dans
`.nestor-version`, contre sa propre commande, sans carte son :

| Langage    | Vérifications et conformité                                                           |
| ---------- | ------------------------------------------------------------------------------------- |
| Python     | `uv run ruff check && uv run ruff format --check && uv run ty check && uv run pytest` |
| TypeScript | `pnpm lint && pnpm typecheck && pnpm test && pnpm conformance`                        |
| Rust       | `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test`        |

L’intégration continue fait de même à chaque pull request et se termine par un seul job `ci`, à
exiger dans vos règles de branche.

## Le publier

Les titres de pull request suivent Conventional Commits ; release-please en tire une pull request
de version, avec le numéro suivant et le changelog. La publication est laissée en commentaire :
dans votre dépôt, déclarez un éditeur de confiance (trusted publisher) sur PyPI, npm ou crates.io,
puis activez le job de publication. Le README de chaque modèle donne les étapes.
