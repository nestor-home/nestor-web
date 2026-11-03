---

title: Démarrage rapide
description: De rien à une première conversation avec Nestor sur votre ordinateur, par écrit, en une dizaine de minutes.
---

Cette page lance Nestor sur votre ordinateur et tient une première conversation avec lui depuis un
terminal. Elle prend le plus court : uv, un modèle hébergé, l’écrit seul.
[Installer](/fr/docs/install/) couvre pip, Docker et un serveur qui reste allumé.

Il vous faut :

- macOS ou Linux avec [uv](https://docs.astral.sh/uv/getting-started/installation/) ;
- une clé chez un fournisseur de modèle. Par défaut [OpenRouter](https://openrouter.ai/keys) ; tout
  serveur compatible OpenAI convient, local compris (voir [Modèles](/fr/docs/models/)).

## Lancer le serveur

### 1. Installer Nestor

```bash
uv tool install nestor-home
```

### 2. Écrire une première configuration

```bash
mkdir nestor && cd nestor
nestor init
```

`nestor init` demande le nom de l’assistant, votre prénom, la langue du foyer (`en` ou `fr`), son
fuseau horaire, le serveur de modèle et le modèle. Entrée garde chaque valeur proposée. Il demande
ensuite un identifiant et un mot de passe pour l’administration (10 caractères au moins).

Il écrit trois choses dans le dossier, sans jamais écraser ce qui existe :

- `nestor.yaml`, la configuration ;
- `.env`, les clés, lisible par vous seul ;
- `state/`, la base de données, qui contient déjà votre compte propriétaire.

### 3. Ajouter la clé du modèle

Ouvrez `.env` et remplissez `MODEL_API_KEY` :

```ini
MODEL_API_KEY=sk-or-...
```

Laissez `TELEGRAM_BOT_TOKEN` vide pour l’instant : Telegram est facultatif.

### 4. Vérifier et démarrer

```bash
nestor check
nestor run
```

`nestor check` lit la configuration et construit chaque partie sans la démarrer. Il nomme ce qui
manque, une clé vide par exemple. `nestor run` démarre le serveur ; laissez-le tourner.

## Ouvrir l’administration

Ouvrez [http://localhost:8470](http://localhost:8470) et connectez-vous avec l’identifiant de
l’étape 2. L’administration montre le foyer, la configuration, les appareils et le journal de ce
que fait Nestor.

## Lui parler

On joint Nestor par des canaux. Le plus rapide est un satellite dans votre terminal : un appareil
qui envoie ce que vous tapez et affiche les réponses.

Dans un second terminal, dans le même dossier, créez-lui un code d’appairage :

```bash
nestor satellites add --room bureau --name Terminal
```

La commande affiche une URI d’appairage, `nestor+http://…:8471/?code=…`. Donnez-la au satellite :

```bash
uvx nestor-satellite run --room bureau --text --no-voice --pairing-uri 'nestor+http://…'
```

Tapez un message, puis Entrée. La réponse revient dans le terminal, et le tour apparaît dans le
journal de l’administration. Les lancements suivants se reconnectent sans code.

## Ensuite

- Lui donner une voix, ou le joindre sur Telegram : [Canaux et voix](/fr/docs/channels/).
- Lui faire voir qui est là et piloter la maison : [Maison et services](/fr/docs/connections/).
- Ce qui se passe pendant ce tour : [Comment fonctionne l’agent](/fr/docs/agent/).
