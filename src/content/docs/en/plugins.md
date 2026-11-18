---

title: Plugins
description: Add a tool, a model, a channel, an executor or a connector to Nestor from your own Python package, without changing the server.
---

Everything Nestor plugs in is a plugin, its own models, channels and tools included: yours are
declared the same way, in your own package. Two cases need none: a service that has an MCP server
([MCP servers](/docs/connections/#mcp-servers)), and a device
([Satellites](/docs/satellites/)).

## What a plugin is

A plugin is four things: a family, a kind (the name the configuration picks it by), a settings
class and a function that builds the part from its settings.

| Family      | Configured under | Builds                                                                                                   | Contract suite                                                                                                               |
| ----------- | ---------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `model`     | `models`         | a `LanguageModel`, `EmbeddingModel`, `ImageModel`, `TranscriptionModel`, `SpeechModel` or `SpeakerModel` | `LanguageModelContract`, `EmbeddingModelContract`, `ImageModelContract`, `TranscriptionModelContract`, `SpeechModelContract` |
| `executor`  | `executors`      | an `Executor`, or a `RemoteExecutor` when the work runs elsewhere and goes on through a restart          | `ExecutorContract`, `RemoteExecutorContract`                                                                                 |
| `channel`   | `channels`       | a `Channel`                                                                                              | `MessagingChannelContract`                                                                                                   |
| `home`      | `home`           | a `Home`: presence and the home's actions                                                                |                                                                                                                              |
| `tools`     | `tools`          | a `ToolProvider`, or a `WebSearch` for a search engine                                                   | `WebSearchContract`                                                                                                          |
| `inbound`   | `inbound`        | an `InboundEventSource`, which feeds the watches                                                         | `InboundEventSourceContract`                                                                                                 |
| `connector` | `connectors`     | a `Connector`: a service people connect accounts to from the admin                                       |                                                                                                                              |

The contracts are in `nestor.modules` (`cognition`, `channels`, `identity`, `home`, `web`,
`initiative`, `connectors`), the suites in `nestor.testing`, which ships with the package.

## A tools plugin

This one gives the agent a `bin_days` tool. The package declares its plugin under the
`nestor.adapters` entry points, in `pyproject.toml`:

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

`nestor_bins/__init__.py` holds the settings, the tool and the plugin:

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

In `nestor.yaml`, `kind` picks the plugin and the other keys are its settings:

```yaml
tools:
  - kind: bins
    days:
      monday: recycling
      thursday: household waste
```

Install the package in the environment Nestor runs in, then check the configuration. With uvx, from
the folder that holds `nestor.yaml`:

```bash
uvx --from nestor-home --with-editable ./nestor-bins nestor check
```

It answers `nestor.yaml: OK`, then names the executors and the channels it built. `nestor check`
builds every part without starting it. A key the settings do not declare is refused,
and so is a kind no installed package provides:

```text
nestor: tools 'bins' (bins): colour: Extra inputs are not permitted
nestor: no tools plugin 'bin' is installed (available: bins, brave, exa, …)
```

The admin's **System** page lists each part with its health and the package it comes from.

## What a plugin can rely on

- **Settings** are a Pydantic model. A `SecretStr` field takes a key (`${NAME}` or
  `${secret:name}` in the configuration, see
  [Keys and secrets](/docs/configuration/#keys-and-secrets)); `RequiredSecret`, from
  `nestor.runtime`, also refuses an empty one.
- **`Services`** gives `build` the data folder, the household's language, and the models of
  `models` by their name (`services.model(...)`).
- **A tool's risk** is `read`, `write` or `sensitive`. A sensitive call is confirmed by the person
  first ([Sensitive actions](/docs/agent/speakers/#sensitive-actions)). A tool that takes longer
  than the turn waits goes on in the background ([Tools](/docs/agent/#tools)).
- **A part's life**: `start` opens what it needs, `close` releases it, `health` says whether it can
  serve, and `notes` tells the model how it runs right now, in English.
- **Optional dependencies** are imported in `build`, and `Plugin(..., requires="my-package[extra]")`
  names what installs them: a configuration that uses the plugin without them fails at start with
  that command. Finding the plugins loads every entry point, so the module that holds `plugin`
  imports only what its settings need.
- **Words for people** are Fluent messages in a `locales/<language>/` folder of your package, which
  Nestor loads with its own. What the model reads stays in English.
- **Events** of your own go in the journal like the server's
  ([Declaring an event](/docs/agent/journal/#declaring-an-event)).

A model plugin also says which type of model it serves, and its entry point is named
`<provider>-<type>`:

```python
plugin = Plugin(Family.MODEL, "my-provider", MySettings, build, serves=LanguageModel)
```

The configuration then names it by both: `type: language`, `provider: my-provider`.

## Test it

A contract suite is a class of tests. Subclass it in your own tests and give it what its docstring
asks for; an executor's suite wants one that completes, a slow one and one that fails:

```python
from nestor.modules.cognition import Executor
from nestor.testing.cognition import ExecutorContract


class TestMyExecutor(ExecutorContract):
    def executor(self) -> Executor: ...
    def slow_executor(self) -> Executor: ...
    def failing_executor(self) -> Executor: ...
```

pytest runs the suite's tests on your part; they are coroutines, so pytest-asyncio is needed, in its
`auto` mode. The server's own adapters pass the same suites.

## Built in

Every part the server ships is a plugin of the package `nestor-home`:

| Family      | Kinds                                                                                                                         | Set up in                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `model`     | `openai-compatible` (language, embedding, image, transcription, speech), `anthropic`, `gemini`, `elevenlabs`, `sherpa-onnx`   | [Models](/docs/models/), [Voice](/docs/channels/#voice)                  |
| `channel`   | `web`, `satellites`, `telegram`, `discord`, `slack`, `matrix`, `signal`, `whatsapp`, `email`, `ntfy`, `webhook`, `openai-api` | [Channels and voice](/docs/channels/)                                    |
| `home`      | `home-assistant`                                                                                                              | [Home Assistant](/docs/connections/#home-assistant)                      |
| `tools`     | `mcp`, `exa`, `parallel`, `firecrawl`, `keenable`, `brave`, `tavily`, `searxng`, `web-pages`, `open-meteo`, `openstreetmap`   | [Home and services](/docs/connections/)                                  |
| `connector` | `google`, `microsoft`, `dav`, `imap`, `mcp`                                                                                   | [Connected accounts](/docs/connections/#connected-accounts)              |
| `inbound`   | `rss`, `web-page`, `webhook`                                                                                                  | [Feeds, pages and webhooks](/docs/connections/#feeds-pages-and-webhooks) |
| `executor`  | `hermes`, `codex`, `claude-code`                                                                                              | [Longer tasks](/docs/connections/#longer-tasks)                          |
