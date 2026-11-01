---

title: Démarrer
description: Lancer un serveur Nestor, créer le compte propriétaire et ouvrir l’administration.
---

Nestor est un assistant open source pour tout le foyer. Un seul agent sait qui est à la maison, se
souvient de chacun, pilote Home Assistant et prend la parole quand quelque chose compte. Son
serveur tourne sur une machine qui reste allumée ; enceintes, tablettes et robots s’y appairent
comme [satellites](/fr/docs/satellites/).

Le projet est jeune : attendez-vous à des changements d’une version à l’autre.

## Lancer le serveur

Le serveur est le paquet Python [`nestor-home`](https://pypi.org/project/nestor-home/) (Python
3.12 ou plus récent), publié aussi en image `ghcr.io/nestor-home/nestor` (amd64, arm64).

### Avec uv ou pip

```bash
uv tool install 'nestor-home[voice]'
# ou
pip install 'nestor-home[voice]'
```

L’extra `voice` apporte le canal vocal temps réel auquel se connectent les satellites. Dans un
dossier vide :

```bash
nestor init
```

La commande demande le nom de l’assistant, votre prénom, un identifiant et un mot de passe (10
caractères au moins), puis écrit `nestor.yaml`, ses secrets dans `.env` (lisible par vous seul) et
`state/`, qui contient le compte propriétaire. Elle n’écrase jamais un fichier.

Remplissez les deux clés de `.env` : `OPENROUTER_API_KEY` pour le modèle (tout point d’accès
compatible OpenAI, réglé dans `nestor.yaml`) et `ELEVENLABS_API_KEY` pour la voix. Gardez
`NESTOR_SECRET_KEY` tel quel : c’est lui qui ouvre le coffre des secrets. Ensuite :

```bash
nestor check   # valide la configuration et construit les adaptateurs
nestor run
```

`nestor` lit le `nestor.yaml` du dossier courant ; `nestor -c <fichier>` en lit un autre. Il lit
aussi le `.env` posé à côté : rien à charger à la main. Une variable déjà définie dans
l’environnement l’emporte sur le fichier.

### Avec Docker

Le [`compose.yaml`](https://github.com/nestor-home/nestor/blob/main/compose.yaml) du dépôt lance
l’image publiée et garde tout dans `./data` :

```bash
mkdir nestor && cd nestor
curl -fsSLO https://raw.githubusercontent.com/nestor-home/nestor/main/compose.yaml
docker compose pull
docker compose run --rm nestor init
$EDITOR data/.env
docker compose up -d
```

Le conteneur tourne sous l’utilisateur 1000 et prend possession de `data` au démarrage. Le port
8080 est celui de l’administration, le 7860 celui du serveur vocal auquel s’appairent les
satellites.

## Le compte propriétaire

`nestor init` le crée. Pour une installation qui n’en a pas encore (configuration écrite à la
main, `state/` venu d’ailleurs) :

```bash
nestor accounts create-owner --login alex
```

Le mot de passe est demandé. `--person` désigne le membre du foyer auquel il appartient (par
défaut, le premier de la configuration). Redémarrez Nestor s’il tourne. Avec Docker, la même
commande s’écrit `docker compose run --rm nestor accounts create-owner --login alex`.

## Ouvrir l’administration

Allez sur [http://localhost:8080](http://localhost:8080), ou l’adresse de la machine sur le port
8080, et connectez-vous avec l’identifiant du propriétaire. On y trouve la configuration, le foyer,
les satellites et le journal de tout ce que Nestor a fait.

## Ensuite

- Appairer un premier appareil : [Satellites](/fr/docs/satellites/).
- Écrire le vôtre : les SDK [Python](/fr/docs/sdks/python/), [TypeScript](/fr/docs/sdks/typescript/)
  et [Rust](/fr/docs/sdks/rust/).
