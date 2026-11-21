import type { ChatMessage } from "@/generated/prisma/client";
import type { ChatSource, ChatUIMessage } from "@/lib/chat/types";
import { chatDateLabel, chatPreview } from "./format";
import { chatSourcesSchema } from "./schemas";
import type { ChatSummary } from "./types";

export const DEFAULT_CHAT_TITLE = "New chat";

export function parseChatSources(value: unknown): ChatSource[] {
  const parsed = chatSourcesSchema.safeParse(value);

  return parsed.success ? parsed.data : [];
}

export function toChatUIMessage(message: ChatMessage): ChatUIMessage {
  const sources = parseChatSources(message.sources);
  const parts: ChatUIMessage["parts"] = [];

  if (sources.length > 0) {
    parts.push({
      id: `sources-${message.id}`,
      type: "data-sources",
      data: sources,
    });
  }

  if (message.content) {
    parts.push({ type: "text", text: message.content });
  }

  return {
    id: message.externalId,
    role: message.role === "USER" ? "user" : "assistant",
    parts,
  };
}

export function toChatSummary(chat: {
  id: string;
  title: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  messages: { content: string }[];
  _count: { messages: number; documents: number };
}): ChatSummary {
  const latestContent = chat.messages[0]?.content.trim() ?? "";

  return {
    id: chat.id,
    title: chat.title,
    preview: latestContent ? chatPreview(latestContent) : null,
    isPinned: chat.isPinned,
    messageCount: chat._count.messages,
    documentCount: chat._count.documents,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    updatedLabel: chatDateLabel(chat.updatedAt.toISOString()),
  };
}
