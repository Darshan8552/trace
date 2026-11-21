import { messageSources, messageText } from "@/lib/chat/message-parts";
import { type ChatUIMessage, sourceHref } from "@/lib/chat/types";

export function chatExportFilename(title: string): string {
  const safe = title
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim()
    .slice(0, 80);

  return `${safe || "trace-chat"}.md`;
}

export function chatToMarkdown({
  title,
  messages,
  origin,
  chatId,
}: {
  title: string;
  messages: ChatUIMessage[];
  origin: string;
  chatId?: string;
}): string {
  const lines = [`# ${title}`, ""];

  for (const message of messages) {
    const text = messageText(message).trim();

    if (!text) {
      continue;
    }

    if (message.role === "user") {
      lines.push("## Question", "", text, "");
      continue;
    }

    lines.push("## Answer", "", text, "");

    const sources = messageSources(message);

    if (sources.length > 0) {
      lines.push("### Sources", "");

      for (const source of sources) {
        const page = source.page ? `, p. ${source.page}` : "";

        lines.push(
          `${source.number}. [${source.title}${page}](${origin}${sourceHref(source, chatId)})`,
        );
      }

      lines.push("");
    }
  }

  return `${lines.join("\n").trim()}\n`;
}
