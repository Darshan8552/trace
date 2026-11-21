import "server-only";
import { llmConfig } from "./config";
import { getLlmProvider } from "./providers/registry";

export function getChatModel() {
  const { chat } = llmConfig();
  return getLlmProvider(chat.provider).languageModel(chat.model);
}

export function getEmbeddingModel() {
  const { embedding } = llmConfig();
  const provider = getLlmProvider(embedding.provider);

  if (!provider.embeddingModel) {
    throw new Error(
      `LLM provider "${provider.label}" does not support embeddings.`,
    );
  }

  return provider.embeddingModel(embedding.model);
}

export function getEmbeddingDimensions(): number {
  return llmConfig().embedding.dimensions;
}

export function isLlmConfigured(): boolean {
  const { chat, embedding } = llmConfig();

  return (
    getLlmProvider(chat.provider).isConfigured() &&
    getLlmProvider(embedding.provider).isConfigured()
  );
}
