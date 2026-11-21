import type { DocumentStatus } from "@/lib/documents/types";

export type EmbeddingConfig = {
  provider: string;
  model: string;
  dimensions: number;
};

export type EmbeddingFields = {
  status: DocumentStatus;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimensions: number;
};

export type ReindexReason = "failed" | "embedding-config";

export function reindexReason(
  document: EmbeddingFields,
  embedding: EmbeddingConfig,
): ReindexReason | null {
  if (document.status === "FAILED") {
    return "failed";
  }

  const configChanged =
    document.embeddingProvider !== embedding.provider ||
    document.embeddingModel !== embedding.model ||
    document.embeddingDimensions !== embedding.dimensions;

  return configChanged ? "embedding-config" : null;
}
