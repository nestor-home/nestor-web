---

title: Introduction
description: Ce que Nestor fait pour un foyer, de quoi il est fait, et par où commencer.
---

Nestor est un assistant open source pour tout le foyer. Il tourne sur une machine de la maison, et
tout le monde lui parle : à voix haute dans la cuisine, par écrit au bureau, sur Telegram dehors. Le
projet est jeune : attendez-vous à des changements d’une version à l’autre.

## Ce qu’il fait pour vous

- **Il sait qui demande**, et garde les conversations et les souvenirs de chacun.
- **Il se souvient** de ce que vous lui avez dit, avec les dates, et retrouve ce qui compte à
  chaque tour.
- **Il pilote la maison** par Home Assistant, et sait qui est là.
- **Il guette** un colis ou une réponse dans vos mails.
- **Il parle à la bonne personne**, là où elle est, et se tait la nuit.
- **Il tient un journal** de tout ce qu’il fait et pourquoi, visible dans l’administration.

## De quoi il est fait

- **Le serveur**, le paquet Python `nestor-home` : l’agent, sa mémoire, son journal et
  l’administration.
- **Un modèle de langage**, hébergé ou local.
- **Des canaux** : Telegram, et les **satellites**, sur lesquels on tape ou auxquels on parle (une
  enceinte, une tablette au mur, un robot Reachy Mini).
- **Des intégrations** : Home Assistant, des serveurs MCP, le courrier, des agents pour les tâches
  longues.

## Par où commencer

| Vous voulez…                                           | Lisez                                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| essayer Nestor sur votre ordinateur en dix minutes     | [Démarrage rapide](/fr/docs/quickstart/)                                                                       |
| l’installer pour de bon, sur un serveur ou avec Docker | [Installer](/fr/docs/install/)                                                                                 |
| savoir ce qu’il fait pendant une conversation          | [Comment fonctionne l’agent](/fr/docs/agent/), [Mémoire](/fr/docs/agent/memory/)                               |
| choisir un modèle, local ou hébergé                    | [Modèles](/fr/docs/models/)                                                                                    |
| lui parler à voix haute, ou sur Telegram               | [Canaux et voix](/fr/docs/channels/)                                                                           |
| brancher Home Assistant, vos mails, des serveurs MCP   | [Maison et services](/fr/docs/connections/)                                                                    |
| ajouter une enceinte ou un écran dans une pièce        | [Satellites](/fr/docs/satellites/)                                                                             |
| construire votre propre appareil                       | le SDK [Python](/fr/docs/sdks/python/), [TypeScript](/fr/docs/sdks/typescript/) ou [Rust](/fr/docs/sdks/rust/) |
