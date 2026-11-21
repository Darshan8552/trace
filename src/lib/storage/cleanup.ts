import "server-only";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

const MAX_PENDING = 100;

function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}

export async function removeOrEnqueue(storageKey: string): Promise<void> {
  try {
    await getStorage().remove(storageKey);
    await prisma.blobDeletion.deleteMany({ where: { storageKey } });
  } catch (error) {
    logError("storage.remove", error, { storageKey });

    await prisma.blobDeletion.upsert({
      where: { storageKey },
      create: {
        storageKey,
        attempts: 1,
        lastError: errorMessage(error),
      },
      update: {
        attempts: { increment: 1 },
        lastError: errorMessage(error),
      },
    });
  }
}

export async function retryPendingBlobDeletions(): Promise<{
  removed: number;
  remaining: number;
}> {
  const pending = await prisma.blobDeletion.findMany({
    orderBy: { createdAt: "asc" },
    take: MAX_PENDING,
  });
  let removed = 0;

  for (const entry of pending) {
    try {
      await getStorage().remove(entry.storageKey);
      await prisma.blobDeletion.delete({
        where: { storageKey: entry.storageKey },
      });
      removed += 1;
    } catch (error) {
      logError("storage.retry-remove", error, {
        storageKey: entry.storageKey,
      });

      await prisma.blobDeletion.update({
        where: { storageKey: entry.storageKey },
        data: {
          attempts: { increment: 1 },
          lastError: errorMessage(error),
        },
      });
    }
  }

  return { removed, remaining: pending.length - removed };
}
