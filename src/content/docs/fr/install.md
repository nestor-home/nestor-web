---

title: Installer
description: Le serveur avec uv, pip ou Docker ; où chacun range sa configuration, et comment le mettre à jour.
---

Le serveur est le paquet Python [`nestor-home`](https://pypi.org/project/nestor-home/) (Python
3.12 ou plus récent), publié aussi en image `ghcr.io/nestor-home/nestor` (amd64, arm64). Les trois
voies lancent le même serveur :

| Installer avec              | uv                                                            | pip                                                   | Docker                                   |
| --------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------- |
| Ce qu’on obtient            | `nestor` dans le `PATH`, dans son propre environnement        | `nestor` dans un environnement virtuel que vous gérez | l’image, avec `docker run` ou Compose    |
| Python                      | uv le télécharge au besoin                                    | le vôtre, 3.12 ou plus                                | dans l’image                             |
| Configuration, `.env`, état | le dossier où vous avez lancé `nestor init`                   | le dossier où vous avez lancé `nestor init`           | le dossier monté sur `/data`             |
| Mise à jour                 | `uv tool upgrade nestor-home`                                 | `pip install -U nestor-home`                          | `docker pull`, puis un nouveau conteneur |
| Pour                        | une machine de développement, un essai, écrire des satellites | un environnement que vous avez déjà                   | un serveur à la maison, toujours allumé  |

Le paquet seul fait tourner Nestor à l’écrit : l’administration, Telegram, les connecteurs, tout
modèle compatible OpenAI, et les satellites à l’écrit. Leur voix temps réel est l’extra `voice` :
installez `'nestor-home[voice]'` pour l’ajouter. L’image contient tous les extras. Une configuration
qui donne une voix aux satellites sans l’extra échoue au démarrage et donne la commande
à lancer.

## Avec uv

[uv](https://docs.astral.sh/uv/) installe `nestor` comme un outil : un environnement isolé, la
commande dans le `PATH`, rien à activer.

```bash
uv tool install nestor-home
mkdir nestor && cd nestor
nestor init
```

Avec la voix des satellites, la première ligne devient `uv tool install 'nestor-home[voice]'`, et
`nestor init` demande s’il faut l’utiliser. Remplissez les clés laissées vides dans `.env` (voir
[Fournisseurs](/fr/docs/providers/)), puis :

```bash
nestor check
nestor run
```

`nestor` lit le `nestor.yaml` du dossier courant ; `nestor -c <fichier>` en lit un autre, depuis
n’importe où. Il relit aussi le `.env` posé à côté à chaque démarrage : rien à charger à la main. Une variable déjà
définie dans l’environnement (le shell, un gestionnaire de services) l’emporte sur le fichier.

Pour mettre à jour, extras compris :

```bash
uv tool upgrade nestor-home
```

## Avec pip

Dans un environnement virtuel que vous créez et gardez :

```bash
python3 -m venv ~/.venvs/nestor
~/.venvs/nestor/bin/pip install nestor-home
mkdir nestor && cd nestor
~/.venvs/nestor/bin/nestor init
```

Ensuite `nestor check` et `nestor run` comme plus haut, depuis l’environnement (activez-le, ou
appelez `~/.venvs/nestor/bin/nestor`). Pour la voix des satellites, installez
`'nestor-home[voice]'` à la place. Mise à jour : la même commande avec `-U`.

## Avec Docker

L’image `ghcr.io/nestor-home/nestor` garde tout dans `/data`. Montez-y un dossier, écrivez une
première configuration, remplissez les clés, puis lancez-la :

```bash
docker run -it --rm -v ./nestor:/data ghcr.io/nestor-home/nestor init
$EDITOR nestor/.env
docker run -d --name nestor --restart unless-stopped -v ./nestor:/data -p 8470:8470 -p 8471:8471 ghcr.io/nestor-home/nestor
```

`nestor/` contient `nestor.yaml`, son `.env` et `state/`. Le conteneur démarre en root le temps de
donner `/data` à son utilisateur (uid 1000), puis tourne sous cet utilisateur. Il publie deux ports :
8470 pour l’administration (`http://<adresse de la machine>:8470`) et 8471 pour les satellites, qui
s’y appairent et y parlent. Pour les changer, réglez `admin.port` et le `port` du canal des
satellites dans `nestor.yaml`, puis les options `-p` correspondantes.

Chaque commande `nestor` passe par l’image, qui lit `/data/nestor.yaml` :

```bash
docker run --rm -v ./nestor:/data ghcr.io/nestor-home/nestor check
docker run --rm -it -v ./nestor:/data ghcr.io/nestor-home/nestor secrets list
```

Nestor lit `nestor/.env` lui-même, à chaque démarrage : après l’avoir modifié, `docker restart nestor`.
Un serveur de modèle sur la même machine (Ollama, LM Studio) se joint à
`http://host.docker.internal:<port>/v1` depuis le conteneur ; sous Linux, ajoutez
`--add-host host.docker.internal:host-gateway` à `docker run`.

### Avec Compose

Pour une installation qui dure, le [`compose.yaml`](https://github.com/nestor-home/nestor/blob/main/compose.yaml)
du dépôt reprend les mêmes réglages (la ligne `host.docker.internal` comprise) et une réplique
Litestream facultative. Il garde tout dans `./data` :

```bash
curl -fsSLO https://raw.githubusercontent.com/nestor-home/nestor/main/compose.yaml
docker compose run --rm nestor init
docker compose up -d
```

Pour mettre à jour :

```bash
docker compose pull
docker compose up -d
```

`compose.yaml` suit `latest`. Pour rester sur une ligne de versions, fixez l’étiquette, par exemple
`ghcr.io/nestor-home/nestor:0.6` (ou `0.6.0` pour une version précise).

## Le compte propriétaire

`nestor init` le crée. Pour une installation qui n’en a pas encore (configuration écrite à la
main, `state/` venu d’ailleurs) :

```bash
nestor accounts create-owner --login alex
```

Le mot de passe est demandé. `--person` désigne le membre du foyer auquel il appartient (par
défaut, le premier de la configuration). Redémarrez Nestor s’il tourne. Avec Docker, la même
commande s’écrit `docker run --rm -it -v ./nestor:/data ghcr.io/nestor-home/nestor accounts create-owner --login alex`.
