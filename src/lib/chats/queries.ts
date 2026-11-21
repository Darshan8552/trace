import "server-only";
import type { FeedbackSummary } from "@/lib/feedback/types";
import { ratingLabel } from "@/lib/feedback/types";
import { prisma } from "@/lib/prisma";
import { toChatSummary } from "./serialize";
import type { ChatSummary } from "./types";

export async function listChatSummaries(
  userId: string,
): Promise<ChatSummary[]> {
  const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true, documents: true } },
      messages: {
        select: { content: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return chats.map(toChatSummary);
}

export async function listFeedbackForChat(
  userId: string,
  chatId: string,
): Promise<Record<string, FeedbackSummary>> {
  const rows = await prisma.messageFeedback.findMany({
    where: { message: { chatId, chat: { userId } } },
    select: {
      rating: true,
      reason: true,
      note: true,
      message: { select: { externalId: true } },
    },
  });

  const result: Record<string, FeedbackSummary> = {};

  for (const row of rows) {
    result[row.message.externalId] = {
      rating: ratingLabel(row.rating),
      reason: row.reason as FeedbackSummary["reason"],
      note: row.note,
    };
  }

  return result;
}
