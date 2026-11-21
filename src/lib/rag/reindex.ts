import "server-only";
import type { DocumentStatus } from "@/lib/documents/types";
import { llmConfig } from "@/lib/llm/config";
import { prisma } from "@/lib/prisma";
import { processDocument } from "./process-document";
import { type ReindexReason, reindexReason } from "./staleness";

const DEFAULT_LIMIT = 50;
const DEFAULT_BUDGET_MS = 45_000;

export type ReindexCandidate = {
  id: string;
  title: string;
  chatId: string;
  userId: string;
  status: DocumentStatus;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimensions: number;
  error: string | null;
  reason: ReindexReason;
};

export type ReindexTotals = {
  total: number;
  failed: number;
  stale: number;
};

export type ReindexOutcome = {
  documentId: string;
  title: string;
  ok: boolean;
  status?: "READY" | "PROCESSING";
  processed?: number;
  total?: number;
  error?: string;
};

export function summarizeCandidates(
  candidates: ReindexCandidate[],
): ReindexTotals {
  const failed = candidates.filter(
    (candidate) => candidate.reason === "failed",
  ).length;

  return {
    total: candidates.length,
    failed,
    stale: candidates.length - failed,
  };
}

export async function findReindexCandidates({
  userId,
  chatId,
  limit = DEFAULT_LIMIT,
}: {
  userId?: string;
  chatId?: string;
  limit?: number;
} = {}): Promise<ReindexCandidate[]> {
  const { embedding } = llmConfig();

  const documents = await prisma.document.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(chatId ? { chatId } : {}),
      OR: [
        { status: "FAILED" },
        {
          NOT: {
            embeddingProvider: embedding.provider,
            embeddingModel: embedding.model,
            embeddingDimensions: embedding.dimensions,
          },
        },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      chatId: true,
      userId: true,
      status: true,
      embeddingProvider: true,
      embeddingModel: true,
      embeddingDimensions: true,
      error: true,
    },
  });

  return documents.flatMap((document) => {
    const reason = reindexReason(document, embedding);

    return reason ? [{ ...document, reason }] : [];
  });
}

export async function runReindex({
  candidates,
  budgetMs = DEFAULT_BUDGET_MS,
}: {
  candidates: ReindexCandidate[];
  budgetMs?: number;
}): Promise<{ results: ReindexOutcome[]; remaining: number }> {
  const startedAt = Date.now();
  const results: ReindexOutcome[] = [];

  for (let index = 0; index < candidates.length; index += 1) {
    if (Date.now() - startedAt > budgetMs) {
      return { results, remaining: candidates.length - index };
    }

    const candidate = candidates[index];

    try {
      const result = await processDocument({
        documentId: candidate.id,
        userId: candidate.userId,
        reindex: true,
      });

      results.push({
        documentId: candidate.id,
        title: candidate.title,
        ok: true,
        status: result.status,
        processed: result.processed,
        total: result.total,
      });
    } catch (error) {
      results.push({
        documentId: candidate.id,
        title: candidate.title,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "This document could not be indexed.",
      });
    }
  }

  return { results, remaining: 0 };
}
