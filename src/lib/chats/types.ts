import type { ChatUIMessage } from "@/lib/chat/types";

export type ChatSummary = {
  id: string;
  title: string;
  preview: string | null;
  isPinned: boolean;
  messageCount: number;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  updatedLabel: string;
};

export type ChatWithMessages = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatUIMessage[];
};
