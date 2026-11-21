import "server-only";
import type { DocumentStatus } from "@/generated/prisma/enums";
import { llmConfig } from "@/lib/llm/config";
import { prisma } from "@/lib/prisma";
import type { ContextChunk, ContextDocument } from "./context";

export const CORPUS_MAX_CHARS = 60_000;

export type EmbeddingConfig = {
  provider: string;
  model: string;
  dimensions: number;
};

export type NotebookDocument = {
  id: string;
  title: string;
  status: DocumentStatus;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimensions: number;
};

export type ChatCorpus = {
  documents: ContextDocument[];
  chunks: ContextChunk[];
  totalChars: number;
};

export function isSearchableDocument(
  document: NotebookDocument,
  embedding: EmbeddingConfig,
): boolean {
  return (
    document.status === "READY" &&
    document.embeddingProvider === embedding.provider &&
    document.embeddingModel === embedding.model &&
    document.embeddingDimensions === embedding.dimensions
  );
}

export async function listNotebookDocuments(
  userId: string,
  chatId: string,
): Promise<NotebookDocument[]> {
  return prisma.document.findMany({
    where: { userId, chatId },
    select: {
      id: true,
      title: true,
      status: true,
      embeddingProvider: true,
      embeddingModel: true,
      embeddingDimensions: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function loadChatCorpus({
  userId,
  chatId,
  maxChars = CORPUS_MAX_CHARS,
}: {
  userId: string;
  chatId: string;
  maxChars?: number;
}): Promise<ChatCorpus | null> {
  const { embedding } = llmConfig();

  const [totals] = await prisma.$queryRaw<{ total: number }[]>`
    SELECT COALESCE(SUM(length(c."content")), 0)::int AS "total"
    FROM "chunk" c
    INNER JOIN "document" d ON d."id" = c."documentId"
    WHERE d."userId" = ${userId}
      AND d."chatId" = ${chatId}
      AND d."status" = 'READY'
      AND d."embeddingProvider" = ${embedding.provider}
      AND d."embeddingModel" = ${embedding.model}
      AND d."embeddingDimensions" = ${embedding.dimensions}
  `;

  const totalChars = totals?.total ?? 0;

  if (totalChars > maxChars) {
    return null;
  }

  const documents = await prisma.document.findMany({
    where: {
      userId,
      chatId,
      status: "READY",
      embeddingProvider: embedding.provider,
      embeddingModel: embedding.model,
      embeddingDimensions: embedding.dimensions,
    },
    select: {
      id: true,
      title: true,
      chunks: {
        select: { id: true, content: true, page: true, position: true },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    documents: documents.map((document) => ({
      id: document.id,
      title: document.title,
    })),
    chunks: documents.flatMap((document) =>
      document.chunks.map((chunk) => ({
        id: chunk.id,
        documentId: document.id,
        documentTitle: document.title,
        content: chunk.content,
        page: chunk.page,
        position: chunk.position,
        similarity: 1,
      })),
    ),
    totalChars,
  };
}
