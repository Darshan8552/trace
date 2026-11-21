import type { Document } from "@/generated/prisma/client";
import type { DocumentStatus, DocumentSummary } from "./types";

type EmbeddingConfig = {
  provider: string;
  model: string;
  dimensions: number;
};

export function isSearchable(
  document: Pick<
    Document,
    "status" | "embeddingProvider" | "embeddingModel" | "embeddingDimensions"
  >,
  embedding: EmbeddingConfig,
): boolean {
  return (
    document.status === "READY" &&
    document.embeddingProvider === embedding.provider &&
    document.embeddingModel === embedding.model &&
    document.embeddingDimensions === embedding.dimensions
  );
}

export function toDocumentSummary(
  document: Document,
  embedding: EmbeddingConfig,
): DocumentSummary {
  return {
    id: document.id,
    title: document.title,
    filename: document.filename,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    sourceUrl: document.sourceUrl,
    sourceCheckedAt: document.sourceCheckedAt?.toISOString() ?? null,
    contentHash: document.contentHash,
    pageCount: document.pageCount,
    status: document.status as DocumentStatus,
    error: document.error,
    searchable: isSearchable(document, embedding),
    createdAt: document.createdAt.toISOString(),
  };
}
