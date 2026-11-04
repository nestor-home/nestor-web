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
avec son numéro. Elle ouvre :

- les notes de chaque version depuis la vôtre, ruptures d’abord ;
- un avertissement quand une version change les données ou la configuration ;
- les satellites que la nouvelle version ne sait plus servir, s’il y en a ;
- comment mettre à jour, selon la façon dont Nestor est installé.

## Mettre à jour le serveur

### Installé avec uv ou pip

Cliquez sur **Mettre à jour** dans la fenêtre. Nestor installe la nouvelle version depuis PyPI dans
son propre environnement, vérifie qu’elle s’importe et qu’elle accepte votre configuration
(`nestor check`), et remet la version précédente sinon. Il vous attend ensuite : cliquez sur
**Redémarrer** quand la maison peut se passer de lui une minute. Une conversation en cours est
coupée.

À la main, c’est la même chose :

```bash
uv tool upgrade nestor-home   # ou : pip install -U nestor-home, dans son environnement
nestor check
```

puis un redémarrage.

### Installé avec Docker

```bash
docker compose pull
docker compose up -d
```

Un conteneur ne peut pas remplacer sa propre image. Il lui faudrait le socket Docker, et ce socket
donne à qui le tient les droits root sur la machine : l’administration ne le demande pas.

### Versions qui cassent

Jusqu’à la première version stable, une version peut changer les données en place : ses notes
demandent alors de recréer `state/` (et d’appairer de nouveau les satellites). Lisez-les avant de
mettre à jour.

## Mettre à jour un satellite

Chaque satellite dit quel logiciel il fait tourner et en quelle version, ce que montre sa page. Un
satellite autorisé à `device.update` cherche aussi une version plus récente là où il a été installé,
une fois par jour ; sa page propose alors **Mettre à jour vers** cette version.

- L’appareil va chercher la version lui-même, à sa propre source. Nestor ne lui envoie jamais de
  fichier ni d’adresse, seulement la version que l’appareil a signalée.
- Il l’installe et redémarre dessus. Si la nouvelle version ne se connecte pas en une minute, il
  revient à celle qu’il avait et le signale.
- Il n’installe jamais une version plus ancienne, ni une version qu’il n’a pas trouvée.

Les règles sont dans le protocole ([Mises à jour](/fr/docs/satellites/protocol/#10-mises-à-jour)).
Mettez d’abord le serveur à jour : un satellite sur la version précédente du protocole continue de
marcher tant qu’une version la parle encore.
