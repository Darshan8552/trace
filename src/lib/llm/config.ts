import "server-only";
import { serverEnv } from "@/lib/env";

export function llmConfig() {
  const env = serverEnv();

  return {
    chat: {
      provider: env.AI_CHAT_PROVIDER,
      model: env.AI_CHAT_MODEL,
    },
    embedding: {
      provider: env.AI_EMBEDDING_PROVIDER,
      model: env.AI_EMBEDDING_MODEL,
      dimensions: env.AI_EMBEDDING_DIMENSIONS,
    },
  };
}
