---

title: Plugins
description: Ajouter un outil, un modèle, un canal, un exécutant ou un connecteur à Nestor depuis votre propre paquet Python, sans modifier le serveur.
---

Tout ce que Nestor branche est un plugin, y compris ses propres modèles, canaux et outils : les
vôtres se déclarent de la même façon, dans votre paquet. Deux cas n’en demandent pas : un service
qui a un serveur MCP ([Serveurs MCP](/fr/docs/connections/#serveurs-mcp)), et un appareil
([Satellites](/fr/docs/satellites/)).

## Ce qu’est un plugin

Un plugin, c’est quatre choses : une famille, un `kind` (le nom par lequel la configuration le
choisit), une classe de réglages et une fonction qui construit la partie à partir de ses réglages.

| Famille     | Se configure sous | Construit                                                                                                 | Suite de contrat                                                                                                             |
| ----------- | ----------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `model`     | `models`          | un `LanguageModel`, `EmbeddingModel`, `ImageModel`, `TranscriptionModel`, `SpeechModel` ou `SpeakerModel` | `LanguageModelContract`, `EmbeddingModelContract`, `ImageModelContract`, `TranscriptionModelContract`, `SpeechModelContract` |
| `executor`  | `executors`       | un `Executor`, ou un `RemoteExecutor` quand le travail tourne ailleurs et continue pendant un redémarrage | `ExecutorContract`, `RemoteExecutorContract`                                                                                 |
| `channel`   | `channels`        | un `Channel`                                                                                              | `MessagingChannelContract`                                                                                                   |
| `home`      | `home`            | un `Home` : la présence et les actions de la maison                                                       |                                                                                                                              |
| `tools`     | `tools`           | un `ToolProvider`, ou un `WebSearch` pour un moteur de recherche                                          | `WebSearchContract`                                                                                                          |
| `inbound`   | `inbound`         | un `InboundEventSource`, qui alimente les veilles                                                         | `InboundEventSourceContract`                                                                                                 |
| `connector` | `connectors`      | un `Connector` : un service auquel on connecte des comptes depuis l’administration                        |                                                                                                                              |

Les contrats sont dans `nestor.modules` (`cognition`, `channels`, `identity`, `home`, `web`,
`initiative`, `connectors`), les suites dans `nestor.testing`, livré avec le paquet.

## Un plugin d’outils

Celui-ci donne à l’agent un outil `bin_days`. Le paquet déclare son plugin sous les entry points
`nestor.adapters`, dans `pyproject.toml` :

```toml
[project]
name = "nestor-bins"
version = "0.1.0"
dependencies = ["nestor-home"]

[project.entry-points."nestor.adapters"]
bins = "nestor_bins:plugin"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

`nestor_bins/__init__.py` contient les réglages, l’outil et le plugin :

```python
from collections.abc import Mapping, Sequence

from nestor.modules.cognition.model import ToolSpec
from nestor.modules.cognition.tools import Risk, Tool, ToolContext, ToolOutput, ToolProvider
from nestor.runtime import AdapterSettings, Family, Plugin, Services


class BinsSettings(AdapterSettings):
    days: dict[str, str]


class Bins(ToolProvider):
    def __init__(self, days: Mapping[str, str]) -> None:
        self._days = days

    def tools(self) -> Sequence[Tool]:
        spec = ToolSpec(
            "bin_days",
            "Which bin goes out on which day of the week.",
            {"type": "object", "properties": {}},
        )
        return (Tool(spec=spec, run=self.bin_days, risk=Risk.READ),)

    async def bin_days(self, arguments: Mapping[str, object], context: ToolContext) -> ToolOutput:
        return dict(self._days)


def build(settings: BinsSettings, name: str, services: Services) -> Bins:
    bins = Bins(settings.days)
    bins.name = name
    return bins


plugin = Plugin(Family.TOOLS, "bins", BinsSettings, build)
```

Dans `nestor.yaml`, `kind` choisit le plugin et les autres clés sont ses réglages :

```yaml
tools:
  - kind: bins
    days:
      monday: recyclage
      thursday: ordures ménagères
```

Installez le paquet dans l’environnement où tourne Nestor, puis vérifiez la configuration. Avec uvx,
depuis le dossier de `nestor.yaml` :

```bash
uvx --from nestor-home --with-editable ./nestor-bins nestor check
```

Il répond `nestor.yaml: OK`, puis nomme les exécutants et les canaux qu’il a construits.
`nestor check` construit chaque partie sans la démarrer. Une clé que les réglages ne déclarent pas
est refusée, comme un `kind` qu’aucun paquet installé ne fournit :

```text
nestor: tools 'bins' (bins): colour: Extra inputs are not permitted
nestor: no tools plugin 'bin' is installed (available: bins, brave, exa, …)
```

La page **Système** de l’administration liste chaque partie avec son état et le paquet d’où elle
vient.

## Ce dont un plugin dispose

- **Les réglages** sont un modèle Pydantic. Un champ `SecretStr` reçoit une clé (`${NAME}` ou
  `${secret:name}` dans la configuration, voir
  [Clés et secrets](/fr/docs/configuration/#clés-et-secrets)) ; `RequiredSecret`, de
  `nestor.runtime`, refuse en plus une clé vide.
- **`Services`** donne à `build` le dossier des données, la langue du foyer, et les modèles de
  `models` par leur nom (`services.model(...)`).
- **Le risque d’un outil** est `read`, `write` ou `sensitive`. Un appel sensible est d’abord confirmé
  par la personne ([Actions sensibles](/fr/docs/agent/speakers/#actions-sensibles)). Un outil plus
  long que l’attente du tour continue en arrière-plan ([Les outils](/fr/docs/agent/#les-outils)).
- **La vie d’une partie** : `start` ouvre ce qu’il lui faut, `close` le libère, `health` dit si elle
  peut servir, et `notes` dit au modèle comment elle tourne en ce moment, en anglais.
- **Les dépendances facultatives** s’importent dans `build`, et
  `Plugin(..., requires="mon-paquet[extra]")` nomme ce qui les installe : une configuration qui
  utilise le plugin sans elles échoue au démarrage avec cette commande. Trouver les plugins charge
  tous les entry points : le module qui contient `plugin` n’importe que ce dont ses réglages ont
  besoin.
- **Les mots destinés aux personnes** sont des messages Fluent dans un dossier `locales/<langue>/`
  de votre paquet, que Nestor charge avec les siens. Ce que lit le modèle reste en anglais.
- **Vos propres événements** vont dans le journal comme ceux du serveur
  ([Déclarer un événement](/fr/docs/agent/journal/#déclarer-un-événement)).

Un plugin de modèle dit aussi quel type de modèle il sert, et son entry point s’appelle
`<fournisseur>-<type>` :

```python
plugin = Plugin(Family.MODEL, "my-provider", MySettings, build, serves=LanguageModel)
```

La configuration le nomme alors par les deux : `type: language`, `provider: my-provider`.

## Le tester

Une suite de contrat est une classe de tests. Héritez-en dans vos tests et donnez-lui ce que sa
docstring demande ; celle d’un exécutant veut un exécutant qui réussit, un lent et un qui échoue :

```python
from nestor.modules.cognition import Executor
from nestor.testing.cognition import ExecutorContract


class TestMyExecutor(ExecutorContract):
    def executor(self) -> Executor: ...
    def slow_executor(self) -> Executor: ...
    def failing_executor(self) -> Executor: ...
```

pytest lance les tests de la suite sur votre partie ; ce sont des coroutines, il faut donc
pytest-asyncio, en mode `auto`. Les adaptateurs du serveur passent les mêmes suites.

## Fournis avec le serveur

Chaque partie livrée avec le serveur est un plugin du paquet `nestor-home` :

| Famille     | `kind`                                                                                                                        | Se règle dans                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `model`     | `openai-compatible` (language, embedding, image, transcription, speech), `anthropic`, `gemini`, `elevenlabs`, `sherpa-onnx`   | [Modèles](/fr/docs/models/), [Voix](/fr/docs/channels/#voix)            |
| `channel`   | `web`, `satellites`, `telegram`, `discord`, `slack`, `matrix`, `signal`, `whatsapp`, `email`, `ntfy`, `webhook`, `openai-api` | [Canaux et voix](/fr/docs/channels/)                                    |
| `home`      | `home-assistant`                                                                                                              | [Home Assistant](/fr/docs/connections/#home-assistant)                  |
| `tools`     | `mcp`, `exa`, `parallel`, `firecrawl`, `keenable`, `brave`, `tavily`, `searxng`, `web-pages`, `open-meteo`, `openstreetmap`   | [Maison et services](/fr/docs/connections/)                             |
| `connector` | `google`, `microsoft`, `dav`, `imap`, `mcp`                                                                                   | [Comptes connectés](/fr/docs/connections/#comptes-connectés)            |
| `inbound`   | `rss`, `web-page`, `webhook`                                                                                                  | [Flux, pages et webhooks](/fr/docs/connections/#flux-pages-et-webhooks) |
| `executor`  | `hermes`, `codex`, `claude-code`                                                                                              | [Tâches longues](/fr/docs/connections/#tâches-longues)                  |
