import "server-only";
import { generateText, type UIMessage } from "ai";
import { messageText } from "@/lib/chat/message-parts";
import { getChatModel } from "@/lib/llm/models";
import { logError } from "@/lib/log";
import {
  normalizeRewrittenQuery,
  REWRITE_INSTRUCTIONS,
} from "./rewrite-prompt";

const HISTORY_MESSAGES = 4;
const MESSAGE_CHARS = 1200;
const TIMEOUT_MS = 4000;

export async function rewriteQuery({
  history,
  query,
}: {
  history: UIMessage[];
  query: string;
}): Promise<string> {
  const recent = history
    .map((message) => ({
      role: message.role === "user" ? "User" : "Assistant",
      text: messageText(message).trim().slice(0, MESSAGE_CHARS),
    }))
    .filter((message) => message.text.length > 0)
    .slice(-HISTORY_MESSAGES);

  if (recent.length === 0) {
    return query;
  }

  const transcript = recent
    .map((message) => `${message.role}: ${message.text}`)
    .join("\n");

  try {
    const { text } = await generateText({
      model: getChatModel(),
      instructions: REWRITE_INSTRUCTIONS,
      prompt: [
        "Conversation so far:",
        transcript,
        "",
        `Latest question: ${query}`,
        "",
        "Standalone search query:",
      ].join("\n"),
      temperature: 0,
      maxOutputTokens: 80,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });

    return normalizeRewrittenQuery(text) ?? query;
  } catch (error) {
    logError("rag.rewrite-query", error);
    return query;
  }
}
