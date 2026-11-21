import "server-only";
import { createGoogle } from "@ai-sdk/google";
import { serverEnv } from "@/lib/env";
import type { LlmProvider } from "../types";

let client: ReturnType<typeof createGoogle> | undefined;

function google() {
  client ??= createGoogle({
    apiKey: serverEnv().GOOGLE_GENERATIVE_AI_API_KEY,
  });
  return client;
}

export const googleProvider: LlmProvider = {
  id: "google",
  label: "Google AI Studio",
  isConfigured: () => Boolean(serverEnv().GOOGLE_GENERATIVE_AI_API_KEY),
  languageModel: (modelId) => google()(modelId),
  embeddingModel: (modelId) => google().embedding(modelId),
};
