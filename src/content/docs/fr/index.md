---

title: Démarrer
description: Lancer un serveur Nestor, choisir ses fournisseurs et ouvrir l’administration.
---

Nestor est un assistant open source pour tout le foyer. Un seul agent sait qui est à la maison, se
souvient de chacun, pilote Home Assistant et prend la parole quand c’est important. Son
serveur tourne sur une machine qui reste allumée ; enceintes, tablettes et robots s’y appairent
comme [satellites](/fr/docs/satellites/).

Le projet est jeune : attendez-vous à des changements d’une version à l’autre.

## Le plus court

Sur un ordinateur équipé d’[uv](https://docs.astral.sh/uv/) :

```bash
uv tool install nestor-home
mkdir nestor && cd nestor
nestor init
```

`nestor init` demande le nom de l’assistant, votre prénom, un identifiant et un mot de passe (10
caractères au moins), puis écrit `nestor.yaml`, ses secrets dans `.env` (lisible par vous seul) et
`state/`, qui contient le compte propriétaire. La commande n’écrase jamais un fichier.

Vous avez ainsi Nestor à l’écrit : l’administration, Telegram, les connecteurs. Pour lui parler à
voix haute et appairer des satellites, installez aussi le canal vocal :
`uv tool install 'nestor-home[voice]'`.

La configuration générée utilise OpenRouter pour le modèle, et ElevenLabs pour le canal vocal :
mettez leurs clés dans `.env`, ou choisissez d’autres fournisseurs dans
[Fournisseurs](/fr/docs/providers/). Nestor parle anglais par défaut ; la même page explique comment
le passer en français. Ensuite :

```bash
nestor check   # valide la configuration et construit les adaptateurs
nestor run
```

Rien à charger à la main : `nestor` lit le `.env` posé à côté de sa configuration. pip et Docker
fonctionnent aussi, voir [Installer](/fr/docs/install/).

## Ouvrir l’administration

<!-- PORTS -->

Ouvrez l’administration dans un navigateur, à l’adresse de la machine, et connectez-vous avec
l’identifiant du propriétaire. On y trouve la configuration, le foyer,
les satellites et le journal de tout ce que Nestor a fait.

## Ensuite

- Installer avec pip ou Docker, mettre à jour, savoir où tout est rangé : [Installer](/fr/docs/install/).
- Un autre modèle, un modèle local, Telegram ou le canal vocal, Nestor en français :
  [Fournisseurs](/fr/docs/providers/).
- Appairer un premier appareil : [Satellites](/fr/docs/satellites/).
- Écrire le vôtre : les SDK [Python](/fr/docs/sdks/python/), [TypeScript](/fr/docs/sdks/typescript/)
  et [Rust](/fr/docs/sdks/rust/).
