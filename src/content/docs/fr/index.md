---

title: Démarrer
description: Lancer un serveur Nestor, choisir ses fournisseurs et ouvrir l’administration.
---

Nestor est un assistant open source pour tout le foyer. Un seul agent sait qui est à la maison, se
souvient de chacun, pilote Home Assistant et prend la parole quand quelque chose compte. Son
serveur tourne sur une machine qui reste allumée ; enceintes, tablettes et robots s’y appairent
comme [satellites](/fr/docs/satellites/).

Le projet est jeune : attendez-vous à des changements d’une version à l’autre.

## Le plus court

Sur un ordinateur équipé d’[uv](https://docs.astral.sh/uv/) :

```bash
uv tool install 'nestor-home[voice]'
mkdir nestor && cd nestor
nestor init
```

`nestor init` demande le nom de l’assistant, votre prénom, un identifiant et un mot de passe (10
caractères au moins), puis écrit `nestor.yaml`, ses secrets dans `.env` (lisible par vous seul) et
`state/`, qui contient le compte propriétaire. La commande n’écrase jamais un fichier.

Sa configuration prend OpenRouter pour le modèle et ElevenLabs pour la voix : mettez les deux clés
dans `.env`, ou choisissez d’autres fournisseurs dans [Fournisseurs](/fr/docs/providers/).
Ensuite :

```bash
nestor check   # valide la configuration et construit les adaptateurs
nestor run
```

Rien à charger à la main : `nestor` lit le `.env` posé à côté de sa configuration. pip et Docker
fonctionnent aussi, voir [Installer](/fr/docs/install/).

## Ouvrir l’administration

Allez sur [http://localhost:8080](http://localhost:8080), ou l’adresse de la machine sur le port
8080, et connectez-vous avec l’identifiant du propriétaire. On y trouve la configuration, le foyer,
les satellites et le journal de tout ce que Nestor a fait.

## Ensuite

- Installer avec pip ou Docker, mettre à jour, savoir où tout est rangé : [Installer](/fr/docs/install/).
- Un autre modèle, un modèle local, ou pas de voix du tout : [Fournisseurs](/fr/docs/providers/).
- Appairer un premier appareil : [Satellites](/fr/docs/satellites/).
- Écrire le vôtre : les SDK [Python](/fr/docs/sdks/python/), [TypeScript](/fr/docs/sdks/typescript/)
  et [Rust](/fr/docs/sdks/rust/).
