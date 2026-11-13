arch-title = One core, everything else plugged in.
arch-lede = The core knows no vendor; everything else is an adapter. Pick a part to see what it does and which contracts it implements.
arch-core = The core
arch-ports = Contracts

arch-agent = Central agent
arch-agent-text = Holds the conversation on every channel with a fast, swappable model and direct tools for what is frequent and short: the home, memory, timers, quick lookups.
arch-agent-point-1 = Called directly, never through an execution harness
arch-agent-point-2 = Its persona is built from what is plugged in, so it never promises a capability it lacks

arch-memory = Memory
arch-memory-text = What the agent knows about each person, dated and sourced. Ask it to remember, correct or forget something, by voice or from the admin.
arch-memory-point-1 = Shared within the household by default, personal in its source
arch-memory-point-2 = Full-text search today; search by meaning (vectors) is planned

arch-initiative = Initiative
arch-initiative-text = Watches created from the conversation, a small model that reads what comes in against all of them at once, and a delivery decision (to whom, where, how, when) written with its reason.
arch-initiative-point-1 = Quiet hours, “not now”, never during a conversation
arch-initiative-point-2 = A spoken message left unanswered is followed up in writing

arch-journal = Journal
arch-journal-text = The append-only event log is the source of truth: the admin, audit, durable tasks and replay are read from it. It is one SQLite file.
arch-journal-point-1 = Every turn, tool call, task, memory, unprompted message and policy decision
arch-journal-point-2 = Events are versioned; older records are upgraded as they are read, never rewritten

arch-channels = Channels
arch-channels-text = Ways to reach the same agent with the same memory: realtime voice (browser and satellites) and Telegram. A request made aloud can be answered in writing later.
arch-channels-point-1 = Voice and Telegram today; WhatsApp, Signal, Discord and Matrix are planned
arch-channels-point-2 = Each channel has its own conversation window; memories cross them all

arch-satellites = Satellites
arch-satellites-text = Devices that pair with a code and hold one WebSocket link to the server: typed text and the assistant’s words, events, intents. Audio goes over WebRTC when the device has a microphone or a speaker. They declare their capabilities and carry out intents: the core asks for joy, the device picks the motion. None of them runs an agent of its own.
arch-satellites-point-1 = SDKs in Python, TypeScript and Rust; a black-box conformance suite
arch-satellites-point-2 = Planned: a lighter WebSocket profile for microcontrollers, and a Wyoming gateway for Home Assistant voice satellites

arch-home = Home Assistant
arch-home-text = The home, rooms, people and presence come from Home Assistant over its WebSocket API; devices are driven through its MCP server. Nestor reimplements none of it.
arch-home-point-1 = Presence at the granularity the home has
arch-home-point-2 = Planned: Nestor as a Home Assistant Assist conversation agent

arch-connectors = Connectors
arch-connectors-text = Third-party accounts plugged in from the admin: Google, Microsoft 365, CalDAV, CardDAV and IMAP natively, any MCP server without code. Sign-in goes through OAuth with PKCE, tokens sit in an encrypted vault, and each tool has its own switch.
arch-connectors-point-1 = Tools for the agent, triggers for watches
arch-connectors-point-2 = Tokens never reach the model, the journal or the logs

arch-executors = Executors
arch-executors-text = Long and complex work (research, paperwork, code, browsing) goes to an execution agent as a durable task the agent follows, announces once and can cancel.
arch-executors-point-1 = Hermes today; Codex and others are planned on the same contract
arch-executors-point-2 = Tasks survive a restart and deliver once

arch-providers = Models
arch-providers-text = The agent’s model is an adapter: any OpenAI-compatible API, cloud or local. Speech services are set in the `voice` section of the satellites channel.
arch-providers-point-1 = Swapping one changes configuration, never the core
arch-providers-point-2 = Cloud services are optional; local models use the same contracts
