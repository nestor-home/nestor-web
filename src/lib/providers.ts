/**
 * The providers the documentation's picker shows (docs/providers): the language models the agent
 * talks to and the speech services of the voice channel. `available` providers have a setup, written
 * in the page's content; `planned` ones show the shared badge and a one-line note. The first of a
 * kind is its default: the one `nestor init` writes, shown without JavaScript.
 */
import type { BrandKey } from "@/lib/brands";

export type ProviderKind = "model" | "speech";

export interface Provider {
  /** the brand mark and name, and the tile's address: `#<kind>-<brand>` */
  brand: BrandKey;
  status: "available" | "planned";
  /** runs on the household's own machine */
  local?: boolean;
}

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
};

/** A provider's tile id, which is also the address that opens it; its setup is `<id>-setup`. */
export const panelId = (kind: ProviderKind, brand: BrandKey): string => `${kind}-${brand}`;
