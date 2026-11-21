import "server-only";
import type { LlmProvider, LlmProviderId } from "../types";
import { googleProvider } from "./google";

const providers: Record<LlmProviderId, LlmProvider> = {
  google: googleProvider,
};

export function getLlmProvider(id: string): LlmProvider {
  const provider = providers[id as LlmProviderId];

  if (!provider) {
    throw new Error(
      `Unknown LLM provider "${id}". Available providers: ${Object.keys(providers).join(", ")}.`,
    );
  }

  return provider;
}
