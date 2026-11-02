/**
 * What the documentation's pickers show (docs/providers): the language models the agent talks to,
 * the speech services of the satellites’ voice, and the channels people reach Nestor through.
 * `available` ones have a setup, written in the page's content; `planned` ones show the shared
 * badge and a one-line note. The first of a kind is shown without JavaScript (for models and
 * speech, the one `nestor init` writes). The messaging channels are the home page's own list
 * (`lib/integrations.ts`), so the two pages never disagree.
 */
import type { BrandKey } from "@/lib/brands";
import { INTEGRATIONS, type Integration } from "@/lib/integrations";

export type ProviderKind = "model" | "speech" | "channel";

/** `brand` is the mark, the name and the tile's address: `#<kind>-<brand>` */
export interface Provider extends Integration {
  /** runs on the household's own machine */
  local?: boolean;
  /** a Fluent message naming the tile, for what is not a brand (the satellites channel) */
  label?: string;
}

const messaging = INTEGRATIONS.find((g) => g.group === "messages")?.items ?? [];

export const PROVIDERS: Record<ProviderKind, readonly Provider[]> = {
  model: [
    { brand: "openrouter", status: "available" },
    { brand: "openai", status: "available" },
    { brand: "mistral", status: "available" },
    { brand: "groq", status: "available" },
    { brand: "gemini", status: "available" },
    { brand: "anthropic", status: "available" },
    { brand: "ollama", status: "available", local: true },
    { brand: "lm-studio", status: "available", local: true },
    { brand: "vllm", status: "available", local: true },
    { brand: "llama-cpp", status: "available", local: true },
  ],
  speech: [
    { brand: "elevenlabs", status: "available" },
    { brand: "gradium", status: "planned" },
    { brand: "deepgram", status: "planned" },
    { brand: "cartesia", status: "planned" },
    { brand: "openai", status: "planned" },
    { brand: "whisper", status: "planned", local: true },
    { brand: "kokoro", status: "planned", local: true },
    { brand: "piper", status: "planned", local: true },
  ],
  channel: [
    ...messaging.filter((c) => c.status === "available"),
    { brand: "satellites", status: "available", label: "providers-satellites" },
    ...messaging.filter((c) => c.status === "planned"),
  ],
};

/** A provider's tile id, which is also the address that opens it; its setup is `<id>-setup`. */
export const panelId = (kind: ProviderKind, brand: BrandKey): string => `${kind}-${brand}`;
