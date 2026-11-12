---

title: Mises à jour
description: Comment Nestor apprend qu’une version sort, ce que montre l’administration, et comment mettre à jour le serveur et ses satellites.
---

Nestor vous dit quand une version plus récente sort et ce qu’elle change. Vous mettez à jour le
serveur depuis l’administration, ou avec Docker, et chaque satellite depuis sa page.

## Comment Nestor apprend qu’une version sort

Chaque version de Nestor publie `releases.json` : toutes les versions, leurs changements, et les
versions du protocole des satellites qu’elle parle. Nestor le lit une minute après son démarrage,
puis une fois par jour. Il ne fait que le lire : rien n’est installé, et rien n’est envoyé que la
requête.

```yaml
updates:
  check: true # false : ne jamais lire la liste des versions
```

`feed` est l’adresse de cette liste, la dernière version publiée sur GitHub par défaut. Faites-la
pointer vers une copie pour mettre à jour depuis un miroir.

## Ce que montre l’administration

Quand une version plus récente sort, **Nouvelle version** apparaît en bas de la barre latérale,
avec son numéro. Elle ouvre les notes de chaque version depuis la vôtre (ruptures d’abord, avec les
satellites que la nouvelle version ne sait plus servir), puis comment mettre à jour cette
installation.

## Mettre à jour le serveur

Installé avec `uv tool` ou pip, Nestor se met à jour lui-même : cliquez sur **Installer**, puis
confirmez. Il installe la version depuis PyPI dans son propre environnement avec les extras que vous
utilisez, la vérifie avec `nestor check`, puis redémarre dessus. Si une étape échoue, il remet la
version précédente et le dit. Le redémarrage coupe une conversation en cours.

Sinon, la fenêtre donne les commandes adaptées à l’installation. Avec Docker :

```bash
docker compose pull
docker compose up -d
```

Un conteneur ne peut pas remplacer sa propre image, et l’administration ne demande jamais le
socket Docker, qui lui donnerait les droits root sur la machine. Une copie de développement se met à
jour avec git.

Jusqu’à la première version stable, une version peut changer les données en place : ses notes
demandent alors de recréer `state/` et d’appairer de nouveau les satellites.

## Mettre à jour un satellite

Un satellite autorisé à `device.update` cherche une version plus récente là où il a été installé,
une fois par jour. Sa page affiche alors **Mise à jour disponible** en haut. Le bouton ouvre ce que
change cette version (les notes que l’appareil a trouvées, s’il en a trouvé) et ce qui va se passer.

- L’appareil va chercher la version lui-même. Nestor ne lui envoie que la version qu’il a signalée,
  jamais de fichier ni d’adresse, et n’ouvre jamais lui-même l’adresse des notes.
- Il l’installe et redémarre dessus. Si la nouvelle version ne se connecte pas en une minute, il
  revient à celle qu’il avait et le signale.
- Il n’installe jamais une version plus ancienne, ni une version qu’il n’a pas trouvée.

Les règles sont dans le protocole ([Mises à jour](/fr/docs/satellites/protocol/#10-mises-à-jour)).

## Dans quel ordre

Mettez d’abord le serveur à jour, puis les satellites depuis l’admin. Un satellite mis à jour avant
le serveur parlerait une version que le serveur refuse, et reviendrait en arrière au bout d’une
minute. Quand une version n’accepte plus la version du protocole d’un satellite, les notes le
disent : ce satellite ne peut plus se connecter au nouveau serveur, mettez-le donc à jour sur
l’appareil lui-même, après le serveur.
