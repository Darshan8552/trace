import "server-only";
import { randomUUID } from "node:crypto";
import { hashText } from "@/lib/documents/hash-server";
import { llmConfig } from "@/lib/llm/config";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/rag/process-document";
import { getStorage } from "@/lib/storage";
import { removeOrEnqueue } from "@/lib/storage/cleanup";

export type SampleSource = {
  slug: string;
  title: string;
  filename: string;
  content: string;
};

export class SeedStorageUnavailable extends Error {}

const PROCESS_BUDGET_MS = 45_000;
const MIN_DOCUMENT_BUDGET_MS = 5_000;

export async function seedNotebook({
  userId,
  title,
  scope,
  directory,
  sources,
}: {
  userId: string;
  title: string;
  scope: string;
  directory: string;
  sources: SampleSource[];
}): Promise<{ chatId: string; processed: number; pending: number }> {
  const storage = getStorage();

  if (!storage.isConfigured()) {
    throw new SeedStorageUnavailable();
  }

  const chat = await prisma.chat.create({
    data: { userId, title, titleIsAuto: false },
    select: { id: true },
  });

  const { embedding } = llmConfig();
  const storageKeys: string[] = [];
  const documentIds: string[] = [];

  try {
    for (const source of sources) {
      const storageKey = `documents/${userId}/${directory}/${randomUUID()}-${source.slug}.txt`;
      const bytes = new TextEncoder().encode(source.content);
      const stored = await storage.put(storageKey, bytes, "text/plain");

      storageKeys.push(storageKey);

      const document = await prisma.document.create({
        data: {
          userId,
          chatId: chat.id,
          title: source.title,
          filename: source.filename,
          mimeType: "text/plain",
          sizeBytes: stored.size,
          storageKey,
          contentHash: hashText(source.content),
          embeddingProvider: embedding.provider,
          embeddingModel: embedding.model,
          embeddingDimensions: embedding.dimensions,
        },
        select: { id: true },
      });

      documentIds.push(document.id);
    }
  } catch (error) {
    await Promise.all(storageKeys.map((key) => removeOrEnqueue(key)));
    await prisma.chat.delete({ where: { id: chat.id } });

    throw error;
  }

  const deadline = Date.now() + PROCESS_BUDGET_MS;
  let processed = 0;
  let pending = 0;

  for (const documentId of documentIds) {
    if (Date.now() >= deadline) {
      pending += 1;
      continue;
    }

    try {
      const result = await processDocument({
        documentId,
        userId,
        budgetMs: Math.max(MIN_DOCUMENT_BUDGET_MS, deadline - Date.now()),
      });

      if (result.status === "READY") {
        processed += 1;
      } else {
        pending += 1;
      }
    } catch (error) {
      logError(`${scope}.process`, error, {
        userId,
        chatId: chat.id,
        documentId,
      });
      pending += 1;
    }
  }

  return { chatId: chat.id, processed, pending };
}
