---

title: Installer
description: Le serveur avec uv, pip ou Docker ; où chacun range sa configuration, et comment le mettre à jour.
---

Le serveur est le paquet Python [`nestor-home`](https://pypi.org/project/nestor-home/) (Python
3.12 ou plus récent), publié aussi en image `ghcr.io/nestor-home/nestor` (amd64, arm64). Les trois
voies lancent le même serveur :

| Installer avec              | uv                                                            | pip                                                   | Docker                                  |
| --------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| Ce qu’on obtient            | `nestor` dans le `PATH`, dans son propre environnement        | `nestor` dans un environnement virtuel que vous gérez | l’image, lancée par `compose.yaml`      |
| Python                      | uv le télécharge au besoin                                    | le vôtre, 3.12 ou plus                                | dans l’image                            |
| Configuration, `.env`, état | le dossier où vous avez lancé `nestor init`                   | le dossier où vous avez lancé `nestor init`           | `./data`, à côté de `compose.yaml`      |
| Mise à jour                 | `uv tool upgrade nestor-home`                                 | `pip install -U 'nestor-home[voice]'`                 | `docker compose pull`                   |
| Pour                        | une machine de développement, un essai, écrire des satellites | un environnement que vous tenez déjà                  | un serveur à la maison, toujours allumé |

Installez l’extra `voice` dans tous les cas : c’est le canal vocal temps réel auquel se connectent
les satellites, et aujourd’hui `nestor` ne démarre pas sans lui, même quand la configuration n’a
pas de canal vocal. L’image le contient déjà.

## Avec uv

[uv](https://docs.astral.sh/uv/) installe `nestor` comme un outil : un environnement isolé, la
commande dans le `PATH`, rien à activer.

```bash
uv tool install 'nestor-home[voice]'
mkdir nestor && cd nestor
nestor init
```

Remplissez `.env` (voir [Fournisseurs](/fr/docs/providers/)), puis :

```bash
nestor check
nestor run
```

`nestor` lit le `nestor.yaml` du dossier courant ; `nestor -c <fichier>` en lit un autre, depuis
n’importe où. Il lit aussi le `.env` posé à côté : rien à charger à la main. Une variable déjà
définie dans l’environnement (le shell, un gestionnaire de services) l’emporte sur le fichier.

Pour mettre à jour, en gardant l’extra :

```bash
uv tool upgrade nestor-home
```

## Avec pip

Dans un environnement virtuel que vous créez et gardez :

```bash
python3 -m venv ~/.venvs/nestor
~/.venvs/nestor/bin/pip install 'nestor-home[voice]'
mkdir nestor && cd nestor
~/.venvs/nestor/bin/nestor init
```

Ensuite `nestor check` et `nestor run` comme plus haut, depuis l’environnement (activez-le, ou
appelez `~/.venvs/nestor/bin/nestor`). Mise à jour : `~/.venvs/nestor/bin/pip install -U 'nestor-home[voice]'`.

## Avec Docker

Le [`compose.yaml`](https://github.com/nestor-home/nestor/blob/main/compose.yaml) du dépôt lance
l’image publiée et garde tout dans `./data` :

```bash
mkdir nestor && cd nestor
curl -fsSLO https://raw.githubusercontent.com/nestor-home/nestor/main/compose.yaml
docker compose pull
docker compose run --rm nestor init
$EDITOR data/.env
docker compose up -d
```

`data/` contient `nestor.yaml`, son `.env` et `state/`. Le conteneur démarre en root le temps de
donner `data` à son utilisateur (uid 1000), puis tourne sous cet utilisateur. Le port 8080 est
celui de l’administration, le 7860 celui du serveur vocal auquel s’appairent les satellites.

Chaque commande `nestor` passe par l’image, qui lit `/data/nestor.yaml` :

```bash
docker compose run --rm nestor check
docker compose run --rm nestor secrets list
```

Après avoir modifié `data/.env`, appliquez avec `docker compose up -d` : Compose transmet aussi le
fichier au conteneur comme environnement, et `docker compose restart` garde les anciennes valeurs.

Pour mettre à jour :

```bash
docker compose pull
docker compose up -d
```

`compose.yaml` suit `latest`. Pour rester sur une ligne de versions, fixez l’étiquette, par exemple
`ghcr.io/nestor-home/nestor:0.3` (ou `0.3.0` pour une version précise).

## Le compte propriétaire

`nestor init` le crée. Pour une installation qui n’en a pas encore (configuration écrite à la
main, `state/` venu d’ailleurs) :

```bash
nestor accounts create-owner --login alex
```

Le mot de passe est demandé. `--person` désigne le membre du foyer auquel il appartient (par
défaut, le premier de la configuration). Redémarrez Nestor s’il tourne. Avec Docker, la même
commande s’écrit `docker compose run --rm nestor accounts create-owner --login alex`.
