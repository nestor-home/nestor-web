---

title: Introduction
description: Ce que Nestor fait pour un foyer, de quoi il est fait, et par où commencer dans cette documentation.
---

Nestor est un assistant open source pour tout le foyer. Il tourne sur une machine de la maison qui
reste allumée, et tout le monde parle au même assistant : à voix haute dans la cuisine, par écrit
depuis le bureau, sur Telegram quand on est dehors.

Le projet est jeune : attendez-vous à des changements d’une version à l’autre.

## Ce qu’il fait pour vous

- **Il répond à chacun, et sait qui demande.** Chaque personne a ses conversations et ses
  souvenirs ; un seul agent sert toute la maison.
- **Il se souvient.** De ce que vous lui dites, de ce qui s’est dit dans les conversations passées,
  avec les dates. Il retrouve de lui-même ce qui compte à chaque tour.
- **Il pilote la maison.** Par Home Assistant, il sait qui est là et peut allumer, ouvrir, lire et
  régler ce que Home Assistant contrôle.
- **Il veille.** Demandez-lui de surveiller vos mails pour un colis ou une réponse : il lit ce qui
  arrive et vous prévient quand quelque chose correspond.
- **Il prend la parole au bon moment, auprès de la bonne personne.** Un rappel, une réponse arrivée
  plus tard, une question pour quelqu’un d’autre : il trouve qui doit l’entendre, où, et se tait la
  nuit.
- **Il tient un journal.** Chaque tour, appel d’outil, souvenir et livraison y est écrit, avec sa
  raison. L’administration l’affiche en conversations.

## De quoi il est fait

- **Le serveur**, le paquet Python `nestor-home` : l’agent, sa mémoire, son journal et
  l’administration, sur les ports 8470 (administration) et 8471 (appareils).
- **Un modèle de langage** de votre choix, hébergé ou sur votre propre machine.
- **Des canaux** pour le joindre : Telegram, et les **satellites**, des appareils sur lesquels on
  tape ou auxquels on parle (un Raspberry Pi avec une enceinte, une tablette au mur, un robot
  Reachy Mini).
- **Des intégrations** dont il se sert : Home Assistant, tout serveur MCP, des boîtes mail, des
  agents pour les tâches longues.

[Comment fonctionne l’agent](/fr/docs/agent/) montre comment tout cela s’assemble.

## Par où commencer

| Vous voulez…                                           | Lisez                                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| essayer Nestor sur votre ordinateur en dix minutes     | [Démarrage rapide](/fr/docs/quickstart/)                                                                       |
| l’installer pour de bon, sur un serveur ou avec Docker | [Installer](/fr/docs/install/)                                                                                 |
| comprendre ce qu’il fait pendant une conversation      | [Comment fonctionne l’agent](/fr/docs/agent/), [Mémoire](/fr/docs/agent/memory/)                               |
| choisir un modèle, local ou hébergé                    | [Modèles](/fr/docs/models/)                                                                                    |
| lui parler à voix haute, ou sur Telegram               | [Canaux et voix](/fr/docs/channels/)                                                                           |
| brancher Home Assistant, vos mails, des serveurs MCP   | [Maison et services](/fr/docs/connections/)                                                                    |
| ajouter une enceinte ou un écran dans une pièce        | [Satellites](/fr/docs/satellites/)                                                                             |
| construire votre propre appareil                       | le SDK [Python](/fr/docs/sdks/python/), [TypeScript](/fr/docs/sdks/typescript/) ou [Rust](/fr/docs/sdks/rust/) |
