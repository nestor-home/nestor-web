---

title: Démarrage rapide
description: De rien à une première conversation avec Nestor sur votre ordinateur, par écrit, en une dizaine de minutes.
---

Obtenez une première réponse de Nestor dans votre terminal, par le plus court : uv, un modèle
hébergé, l’écrit seul. Les autres voies sont dans [Installer](/fr/docs/install/).

Il vous faut :

- macOS ou Linux avec [uv](https://docs.astral.sh/uv/getting-started/installation/) ;
- une clé de fournisseur de modèle : [OpenRouter](https://openrouter.ai/keys) par défaut, ou tout
  serveur compatible OpenAI, local compris ([Modèles](/fr/docs/models/)).

## Lancer le serveur

### 1. Installer Nestor

```bash quickstart
uv tool install nestor-home
```

### 2. Écrire une première configuration

```bash quickstart
mkdir nestor && cd nestor
nestor init
```

`nestor init` demande les noms, la langue, le fuseau horaire, le modèle et les canaux à installer ;
Entrée garde chaque valeur proposée. Il crée ensuite votre identifiant d’administration (mot de passe de 10 caractères
au moins).

Il écrit `nestor.yaml` (la configuration), `.env` (les clés) et `state/` (la base de données), sans
jamais écraser l’existant.

### 3. Ajouter la clé du modèle

Remplissez `MODEL_API_KEY` dans `.env` :

```ini
MODEL_API_KEY=sk-or-...
```

### 4. Vérifier et démarrer

```bash quickstart
nestor check
nestor run
```

`nestor check` nomme ce qui manque, une clé vide par exemple. `nestor run` démarre le serveur :
laissez-le tourner.

## Ouvrir l’administration

Ouvrez [http://localhost:8470](http://localhost:8470) et connectez-vous avec l’identifiant de
l’étape 2.

## Lui parler

Dans un second terminal, dans le même dossier, créez un code d’appairage pour un satellite en
terminal :

```bash
nestor satellites add --room bureau --name Terminal
```

Passez l’URI affichée (`nestor+http://…:8471/?code=…`) au satellite :

```bash
uvx nestor-satellite run --room bureau --text --no-voice --pairing-uri 'nestor+http://…'
```

Tapez un message, puis Entrée. La réponse s’affiche dans le terminal et le tour apparaît dans le
journal de l’administration. Les lancements suivants se reconnectent sans code.

## Ensuite

- Lui parler à voix haute, ou sur Telegram : [Canaux et voix](/fr/docs/channels/).
- Lui faire voir qui est là et piloter la maison : [Maison et services](/fr/docs/connections/).
- Ce qui s’est passé pendant ce tour : [Comment fonctionne l’agent](/fr/docs/agent/).
