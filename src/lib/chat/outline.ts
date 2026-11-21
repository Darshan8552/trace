import type { ChatUIMessage } from "@/lib/chat/types";
import { messageText } from "./message-parts";

export type ChatTurn = {
  id: string;
  label: string;
  text: string;
};

const MAX_LABEL_LENGTH = 72;

export function chatTurns(messages: ChatUIMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];

  for (const message of messages) {
    if (message.role !== "user") {
      continue;
    }

    const text = messageText(message).replace(/\s+/g, " ").trim();

    if (!text) {
      continue;
    }

    turns.push({
      id: message.id,
      text,
      label:
        text.length > MAX_LABEL_LENGTH
          ? `${text.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…`
          : text,
    });
  }

  return turns;
}

export function turnAnchorId(messageId: string): string {
  return `turn-${messageId}`;
}
