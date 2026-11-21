import "server-only";
import { generateText } from "ai";
import { getChatModel } from "@/lib/llm/models";
import { logError } from "@/lib/log";
import { chatTitleFromQuery } from "./format";

export function cleanTitle(value: string, query: string): string {
  const cleaned = value
    .replace(/^(title|notebook)\s*:\s*/i, "")
    .replace(/[`"*_[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (cleaned || chatTitleFromQuery(query)).slice(0, 60);
}

export async function updateAutoTitle({
  chatId,
  query,
  answer,
  sourceTitles,
}: {
  chatId: string;
  query: string;
  answer: string;
  sourceTitles: string[];
}): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { text } = await generateText({
      model: getChatModel(),
      instructions:
        "You name notebooks for a document assistant. Reply with only a short descriptive title of at most eight words. No quotes, no punctuation at the end, no explanation.",
      prompt: [
        `Question: ${query.slice(0, 400)}`,
        `Answer: ${answer.slice(0, 600)}`,
        `Sources: ${sourceTitles.slice(0, 4).join(", ") || "none"}`,
      ].join("\n"),
      maxOutputTokens: 24,
      abortSignal: AbortSignal.timeout(20_000),
    });

    const updated = await prisma.chat.updateMany({
      where: { id: chatId, titleIsAuto: true },
      data: { title: cleanTitle(text, query) },
    });

    if (updated.count === 0) {
      return;
    }
  } catch (error) {
    logError("chat.auto-title", error);
  }
}
