import type { EmbeddingModel, LanguageModel } from "ai";

export const LLM_PROVIDER_IDS = ["google"] as const;

export type LlmProviderId = (typeof LLM_PROVIDER_IDS)[number];

export type LlmProvider = {
  id: LlmProviderId;
  label: string;
  isConfigured: () => boolean;
  languageModel: (modelId: string) => LanguageModel;
  embeddingModel?: (modelId: string) => EmbeddingModel;
};
