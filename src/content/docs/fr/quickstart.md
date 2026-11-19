---

title: Démarrage rapide
description: De rien à une première conversation avec Nestor sur votre ordinateur, par écrit, en une dizaine de minutes.
---

Le plus court chemin vers une première réponse : uv, un modèle hébergé, l’écrit seul. Les autres
voies sont dans [Installer](/fr/docs/install/).

Il vous faut macOS ou Linux avec [uv](https://docs.astral.sh/uv/getting-started/installation/), et
une clé de fournisseur de modèle : [OpenRouter](https://openrouter.ai/keys) par défaut, ou tout
serveur compatible OpenAI, local compris ([Modèles](/fr/docs/models/)).

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

Il demande les noms, la langue, le fuseau horaire, le modèle et les canaux (Entrée garde chaque
valeur proposée), puis crée votre identifiant d’administration, avec un mot de passe de 10
caractères au moins. Il écrit `nestor.yaml` (la configuration), `.env` (les clés) et `state/` (la
base de données), sans jamais écraser l’existant.

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

`nestor check` nomme ce qui manque, une clé vide par exemple. Laissez `nestor run` tourner.

</li>
<li>

**Lui écrire** dans l’administration

Ouvrez [http://localhost:8470](http://localhost:8470), connectez-vous avec l’identifiant de
l’étape 2, ouvrez **Parler** et écrivez un message. Nestor répond dans la page.

</li>
</ol>
</div>

## Lui parler depuis un terminal

Un terminal peut servir de satellite. Dans un second terminal, dans le même dossier, créez un code
d’appairage :

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

- Le joindre depuis une messagerie : [Canaux](/fr/docs/channels/). Lui parler à voix haute :
  [Voix](/fr/docs/voice/).
- Lui faire voir qui est là et piloter la maison : [Home Assistant](/fr/docs/home/).
- Ce qui s’est passé pendant ce tour : [Comment fonctionne l’agent](/fr/docs/agent/).
