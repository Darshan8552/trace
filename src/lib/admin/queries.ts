import "server-only";
import type {
  AdminBlobDeletion,
  AdminFailedDocument,
  AdminFeedback,
  AdminStats,
  AdminUser,
} from "@/lib/admin/types";
import type { DocumentStatus } from "@/lib/documents/types";
import { type FeedbackRating, isFeedbackReason } from "@/lib/feedback/types";
import { prisma } from "@/lib/prisma";

const FAILED_DOCUMENT_LIMIT = 25;
const BLOB_DELETION_LIMIT = 25;
const FEEDBACK_LIMIT = 50;
const USER_LIMIT = 50;

function emptyDocumentCounts(): Record<DocumentStatus, number> {
  return { PENDING: 0, PROCESSING: 0, READY: 0, FAILED: 0 };
}

function excerptOf(content: string): string {
  const collapsed = content.replace(/\s+/g, " ").trim();

  return collapsed.length > 240 ? `${collapsed.slice(0, 239)}…` : collapsed;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [
    users,
    notebooks,
    messages,
    documentsByStatus,
    feedbackByRating,
    pendingBlobDeletions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.chat.count(),
    prisma.chatMessage.count(),
    prisma.document.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.messageFeedback.groupBy({ by: ["rating"], _count: { _all: true } }),
    prisma.blobDeletion.count(),
  ]);

  const documents = emptyDocumentCounts();

  for (const row of documentsByStatus) {
    documents[row.status] = row._count._all;
  }

  let feedbackUp = 0;
  let feedbackDown = 0;

  for (const row of feedbackByRating) {
    if (row.rating >= 1) {
      feedbackUp += row._count._all;
    } else {
      feedbackDown += row._count._all;
    }
  }

  return {
    users,
    notebooks,
    messages,
    documents,
    feedbackUp,
    feedbackDown,
    pendingBlobDeletions,
  };
}

export async function listFailedDocuments({
  take = FAILED_DOCUMENT_LIMIT,
}: {
  take?: number;
} = {}): Promise<AdminFailedDocument[]> {
  const documents = await prisma.document.findMany({
    where: { status: "FAILED" },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      chatId: true,
      userId: true,
      error: true,
      updatedAt: true,
      mimeType: true,
      sizeBytes: true,
      chat: { select: { title: true } },
      user: { select: { email: true } },
    },
  });

  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    chatId: document.chatId,
    chatTitle: document.chat.title,
    userId: document.userId,
    userEmail: document.user.email,
    error: document.error,
    updatedAt: document.updatedAt.toISOString(),
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
  }));
}

export async function listPendingBlobDeletions({
  take = BLOB_DELETION_LIMIT,
}: {
  take?: number;
} = {}): Promise<AdminBlobDeletion[]> {
  const deletions = await prisma.blobDeletion.findMany({
    orderBy: { createdAt: "asc" },
    take,
    select: {
      storageKey: true,
      attempts: true,
      lastError: true,
      createdAt: true,
    },
  });

  return deletions.map((deletion) => ({
    storageKey: deletion.storageKey,
    attempts: deletion.attempts,
    lastError: deletion.lastError,
    createdAt: deletion.createdAt.toISOString(),
  }));
}

export async function listUsers({
  take = USER_LIMIT,
  search,
}: {
  take?: number;
  search?: string;
} = {}): Promise<AdminUser[]> {
  const query = search?.trim();

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      createdAt: true,
      _count: { select: { sessions: true, chats: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    banned: user.banned,
    banReason: user.banReason,
    banExpires: user.banExpires?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    sessionCount: user._count.sessions,
    chatCount: user._count.chats,
  }));
}

export async function listRecentFeedback({
  take = FEEDBACK_LIMIT,
  rating,
}: {
  take?: number;
  rating?: FeedbackRating;
} = {}): Promise<AdminFeedback[]> {
  const rows = await prisma.messageFeedback.findMany({
    where: rating ? { rating: rating === "up" ? { gte: 1 } : { lt: 1 } } : {},
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      rating: true,
      reason: true,
      note: true,
      createdAt: true,
      message: {
        select: {
          id: true,
          content: true,
          chatId: true,
          chat: { select: { title: true } },
        },
      },
      user: { select: { email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    rating: row.rating >= 1 ? "up" : "down",
    reason: isFeedbackReason(row.reason) ? row.reason : null,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    messageId: row.message.id,
    excerpt: excerptOf(row.message.content),
    chatId: row.message.chatId,
    chatTitle: row.message.chat.title,
    userEmail: row.user.email,
  }));
}
