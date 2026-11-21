import type { ChatSource } from "@/lib/chat/types";

const CITATION = /\[(\d{1,3})\]/g;
const HAS_CITATION = /\[\d{1,3}\]/;

export function citedNumbers(text: string): Set<number> {
  const numbers = new Set<number>();

  for (const match of text.matchAll(CITATION)) {
    numbers.add(Number(match[1]));
  }

  return numbers;
}

export function stripInvalidCitations(
  text: string,
  sources: ChatSource[],
): string {
  const valid = new Set(sources.map((source) => source.number));

  if (!HAS_CITATION.test(text)) {
    return text;
  }

  return text
    .replace(CITATION, (match, raw: string) =>
      valid.has(Number(raw)) ? match : "",
    )
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}
