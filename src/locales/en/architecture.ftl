arch-title = One core, everything else plugged in.
arch-lede = The core runs on your server and knows no vendor. Channels, satellites, the home, accounts, executors and AI providers connect through public contracts. Pick a part to see what it does.
arch-core = The core
arch-ports = Contracts

arch-agent = Central agent
arch-agent-text = Holds the conversation on every channel with a fast, swappable model and direct tools for what is frequent and short: the home, memory, timers, quick lookups.
arch-agent-point-1 = First sentence in 0.64 s median, called directly
arch-agent-point-2 = A tool moves from delegation to direct only when measured latency justifies it

arch-memory = Memory
arch-memory-text = What the agent knows about each person: dated, sourced, searchable. Remember, recall, correct, forget — by voice or from the admin.
arch-memory-point-1 = Shared within the household by default, personal in its source
arch-memory-point-2 = Full-text search today; vector search when a bench justifies it

arch-initiative = Initiative
arch-initiative-text = Watches created from the conversation, three-stage triage of what comes in, and a delivery decision — to whom, where, how, when — written with its reason.
arch-initiative-point-1 = Quiet hours, “not now”, never during a conversation
arch-initiative-point-2 = A spoken message left unanswered is followed up in writing

arch-journal = Journal
arch-journal-text = The append-only event log is the source of truth: the admin, audit, durable tasks and replay are all read from it. One SQLite file in WAL mode.
arch-journal-point-1 = Every turn, tool call, task, memory, unprompted message and policy decision
arch-journal-point-2 = Continuous replication with Litestream, optional

arch-channels = Channels
arch-channels-text = Ways to reach the same agent with the same memory: realtime voice — in a browser first — and Telegram. A request made aloud can be answered in writing an hour later.
arch-channels-point-1 = Voice and Telegram today; WhatsApp and Discord later
arch-channels-point-2 = Each household account is linked to its people on each channel

arch-satellites = Satellites
arch-satellites-text = Devices that pair with a code and talk standard protocols: WebRTC audio, events on a data channel. They declare their capabilities and carry out intents; they never hold a second brain.
arch-satellites-point-1 = SDKs in Python, TypeScript and Rust; a black-box conformance suite
arch-satellites-point-2 = Safety — watchdog, motion limits — runs on the device, never over the network

arch-home = Home Assistant
arch-home-text = The home, rooms, people and presence come from Home Assistant over its WebSocket API; devices are driven through its MCP server. Nestor integrates rather than reimplements.
arch-home-point-1 = Presence at the granularity the home has
arch-home-point-2 = Later: Nestor as a Home Assistant Assist conversation agent

arch-connectors = Connectors
arch-connectors-text = Third-party accounts plugged from the admin: Gmail and IMAP natively, any MCP server without code. OAuth with PKCE, an encrypted vault, a switch per tool.
arch-connectors-point-1 = Tools for the agent, triggers for watches
arch-connectors-point-2 = Tokens never reach the model, the journal or the logs

arch-executors = Executors
arch-executors-text = Long and complex work — code, browsing, research, paperwork — goes to an execution agent such as Hermes or Codex, as a durable task the agent follows, announces and can cancel.
arch-executors-point-1 = An executor declares what it can do, so the agent never over-promises
arch-executors-point-2 = Tasks survive a restart and deliver once

arch-providers = AI providers
arch-providers-text = Language models, speech-to-text, voices and turn detection are adapters chosen in configuration and on reproducible benchmarks. Any OpenAI-compatible model API works for the agent.
arch-providers-point-1 = Swapping one changes configuration, never the core
arch-providers-point-2 = Cloud services are optional by design; local models fit the same contracts
