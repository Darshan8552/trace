import type { ChatSource } from "@/lib/chat/types";

function shortTitle(title: string): string {
  const trimmed = title.trim();

  if (trimmed.length <= 48) {
    return trimmed;
  }

  return `${trimmed.slice(0, 47).trimEnd()}\u2026`;
}

export function suggestFollowUps(sources: ChatSource[]): string[] {
  const titles = [
    ...new Set(
      sources.map((source) => shortTitle(source.title)).filter(Boolean),
    ),
  ];

  if (titles.length === 0) {
    return [];
  }

  if (titles.length === 1) {
    return [`What else does ${titles[0]} say?`, `Summarize ${titles[0]}`];
  }

  const [first, second] = titles;

  return [
    `Compare ${first} and ${second}`,
    `What do ${first} and ${second} agree on?`,
    "Which passage supports citation [1]?",
  ];
}
