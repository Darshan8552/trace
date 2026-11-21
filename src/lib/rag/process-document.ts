import "server-only";
import { randomUUID } from "node:crypto";
import { llmConfig } from "@/lib/llm/config";
import { embedDocuments } from "@/lib/llm/embed";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { chunkPages } from "./chunk";
import { extractPages } from "./extract";

const BATCH_SIZE = 24;
const DEFAULT_BUDGET_MS = 40_000;
const READ_ATTEMPTS = 6;
const READ_RETRY_MS = 750;

export class DocumentNotFoundError extends Error {}

export type ProcessResult = {
  status: "READY" | "PROCESSING";
  processed: number;
  total: number;
};

function vectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

async function readBytes(storageKey: string): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= READ_ATTEMPTS; attempt += 1) {
    const blob = await getStorage().read(storageKey);

    if (blob) {
      return new Uint8Array(await new Response(blob.stream).arrayBuffer());
    }

    if (attempt < READ_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, READ_RETRY_MS));
    }
  }

  throw new Error("The stored file could not be read.");
}

export async function processDocument({
  documentId,
  userId,
  budgetMs = DEFAULT_BUDGET_MS,
  reindex = false,
}: {
  documentId: string;
  userId: string;
  budgetMs?: number;
  reindex?: boolean;
}): Promise<ProcessResult> {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    throw new DocumentNotFoundError("Document not found.");
  }

  if (!reindex && document.status === "READY") {
    const total = await prisma.chunk.count({
      where: { documentId: document.id },
    });

    return { status: "READY", processed: total, total };
  }

  if (reindex) {
    const { embedding } = llmConfig();

    await prisma.$transaction([
      prisma.chunk.deleteMany({ where: { documentId: document.id } }),
      prisma.document.update({
        where: { id: document.id },
        data: {
          status: "PROCESSING",
          error: null,
          embeddingProvider: embedding.provider,
          embeddingModel: embedding.model,
          embeddingDimensions: embedding.dimensions,
        },
      }),
    ]);
  } else {
    await prisma.document.updateMany({
      where: { id: document.id },
      data: { status: "PROCESSING", error: null },
    });
  }

  try {
    const bytes = await readBytes(document.storageKey);
    const extraction = await extractPages({
      bytes,
      mimeType: document.mimeType,
    });
    const chunks = chunkPages(extraction.pages);

    if (chunks.length === 0) {
      throw new Error("No readable text was found in this file.");
    }

    const existing = await prisma.chunk.findMany({
      where: { documentId: document.id },
      select: { position: true },
    });
    const indexedPositions = new Set(existing.map((chunk) => chunk.position));
    const missing = chunks.filter(
      (chunk) => !indexedPositions.has(chunk.position),
    );

    await prisma.document.update({
      where: { id: document.id },
      data: { pageCount: extraction.totalPages },
    });

    let processed = chunks.length - missing.length;
    const startedAt = Date.now();

    for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
      if (Date.now() - startedAt > budgetMs) {
        return { status: "PROCESSING", processed, total: chunks.length };
      }

      const batch = missing.slice(offset, offset + BATCH_SIZE);
      const embeddings = await embedDocuments(
        batch.map((chunk) => chunk.content),
      );

      await prisma.$transaction(
        batch.map(
          (chunk, index) => prisma.$executeRaw`
            INSERT INTO "chunk" ("id", "documentId", "content", "position", "page", "embedding", "createdAt")
            VALUES (
              ${randomUUID()},
              ${document.id},
              ${chunk.content},
              ${chunk.position},
              ${chunk.page},
              ${vectorLiteral(embeddings[index] ?? [])}::vector,
              now()
            )
            ON CONFLICT ("documentId", "position") DO NOTHING
          `,
        ),
      );

      processed += batch.length;
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "READY", error: null },
    });

    return { status: "READY", processed: chunks.length, total: chunks.length };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "This document could not be indexed.";

    await prisma.document.updateMany({
      where: { id: document.id },
      data: { status: "FAILED", error: message.slice(0, 500) },
    });

    throw error;
  }
}
