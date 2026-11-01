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

`nestor init` demande le nom de l’assistant, votre prénom, la langue du foyer (`en` ou `fr`), son
fuseau horaire (celui de la machine par défaut), le serveur de modèle et le modèle, puis un
identifiant et un mot de passe (10 caractères au moins). La commande écrit `nestor.yaml`, ses
secrets dans `.env` (lisible par vous seul) et `state/`, qui contient le compte propriétaire. Elle
n’écrase jamais un fichier.

Vous avez ainsi Nestor à l’écrit, sur Telegram, avec n’importe quel modèle compatible OpenAI :
l’administration et les connecteurs sont fournis. Pour lui parler à voix haute et appairer des
satellites, installez aussi le canal vocal : `uv tool install 'nestor-home[voice]'`. `nestor init`
vous demande alors si vous le voulez ; sans l’extra, le bloc vocal de `nestor.yaml` reste en
commentaire.

Remplissez les clés que `nestor init` a laissées vides dans `.env` : `MODEL_API_KEY` pour le modèle
(vide pour un serveur local comme Ollama), et `TELEGRAM_BOT_TOKEN`, ou `ELEVENLABS_API_KEY` pour le
canal vocal. [Fournisseurs](/fr/docs/providers/) dit où obtenir chacune. Ensuite :

```bash
nestor check   # valide la configuration et construit les adaptateurs
nestor run
```

`nestor check` nomme toute clé restée vide. Rien à charger à la main : `nestor` relit le `.env`
posé à côté de sa configuration à chaque démarrage. pip et Docker fonctionnent aussi, voir [Installer](/fr/docs/install/).

## Ouvrir l’administration

L’administration écoute sur le port 8470 : ouvrez `http://localhost:8470` sur la machine
elle-même, ou `http://<son adresse>:8470` depuis un autre appareil, et connectez-vous avec
l’identifiant du propriétaire. On y trouve la configuration, le foyer, les satellites et le journal
de tout ce que Nestor a fait. `admin.port` dans `nestor.yaml` change le port.

## Ensuite

- Installer avec pip ou Docker, mettre à jour, savoir où tout est rangé : [Installer](/fr/docs/install/).
- Un autre modèle, un modèle local, Telegram ou le canal vocal, Nestor en français :
  [Fournisseurs](/fr/docs/providers/).
- Appairer un premier appareil : [Satellites](/fr/docs/satellites/).
- Écrire le vôtre : les SDK [Python](/fr/docs/sdks/python/), [TypeScript](/fr/docs/sdks/typescript/)
  et [Rust](/fr/docs/sdks/rust/).
