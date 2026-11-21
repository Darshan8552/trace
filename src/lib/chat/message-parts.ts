import type { UIMessage } from "ai";
import type { ChatSource } from "@/lib/chat/types";

export function messageText(message: { parts: UIMessage["parts"] }): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function messageSources(message: {
  parts: UIMessage["parts"];
}): ChatSource[] {
  return message.parts.flatMap((part) => {
    if (part.type !== "data-sources" || !Array.isArray(part.data)) {
      return [];
    }

    return part.data as ChatSource[];
  });
}
