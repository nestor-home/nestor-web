---

title: Démarrage rapide
description: De rien à une première conversation avec Nestor sur votre ordinateur, par écrit, en une dizaine de minutes.
---

Il vous faut macOS ou Linux avec [uv](https://docs.astral.sh/uv/getting-started/installation/) et
une clé de modèle ([OpenRouter](https://openrouter.ai/keys) par défaut, ou [tout serveur compatible
OpenAI](/fr/docs/models/)). Autres voies : [Installer](/fr/docs/install/).

## Lancer le serveur

<div class="doc-steps">
<ol>
<li>

**Installer Nestor**

```bash quickstart
uv tool install nestor-home
```

</li>
<li>

**Écrire une première configuration**

```bash quickstart
mkdir nestor && cd nestor
nestor init
```

Répondez aux questions (Entrée garde la valeur proposée) et choisissez un mot de passe d’administration
de 10 caractères au moins. Il écrit `nestor.yaml`, `.env` (clés) et `state/` (base), sans rien écraser.

</li>
<li>

**Ajouter la clé du modèle** dans `MODEL_API_KEY`, dans `.env`

```ini
MODEL_API_KEY=sk-or-...
```

</li>
<li>

**Vérifier et démarrer**

```bash quickstart
nestor check
nestor run
```

`nestor check` nomme ce qui manque. Laissez `nestor run` tourner.

</li>
<li>

**Lui écrire** dans l’administration

Ouvrez [http://localhost:8470](http://localhost:8470), connectez-vous, ouvrez **Parler** et écrivez.

</li>
</ol>
</div>

## Lui parler depuis un terminal

Dans un second terminal, même dossier, créez un code d’appairage :

```bash
nestor satellites add --room bureau --name Terminal
```

Passez l’URI affichée au satellite :

```bash
uvx nestor-satellite run --room bureau --text --no-voice --pairing-uri 'nestor+http://…'
```

Tapez un message, puis Entrée. Les lancements suivants se reconnectent sans code.

## Ensuite

- [Canaux](/fr/docs/channels/) et [Voix](/fr/docs/voice/)
- [Home Assistant](/fr/docs/home/)
- [Comment fonctionne l’agent](/fr/docs/agent/)
