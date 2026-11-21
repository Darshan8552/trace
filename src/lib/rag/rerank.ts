const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "did",
  "do",
  "does",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "with",
]);

const WORD = /[\p{L}\p{N}]+/gu;

function queryTerms(query: string): string[] {
  const terms = query.toLowerCase().match(WORD) ?? [];

  return [
    ...new Set(
      terms.filter((term) => term.length > 2 && !STOP_WORDS.has(term)),
    ),
  ];
}

function phraseBonus(query: string, content: string): number {
  const words = (query.toLowerCase().match(WORD) ?? []).filter(
    (word) => word.length > 2 && !STOP_WORDS.has(word),
  );

  if (words.length < 2) {
    return 0;
  }

  return content.includes(words.join(" ")) ? 0.1 : 0;
}

export function rerankChunks<T extends { content: string; similarity: number }>(
  chunks: T[],
  query: string,
): T[] {
  const terms = queryTerms(query);

  if (terms.length === 0 || chunks.length < 2) {
    return chunks;
  }

  return chunks
    .map((chunk, index) => {
      const content = chunk.content.toLowerCase();
      const matched = terms.filter((term) => content.includes(term)).length;

      return {
        chunk,
        index,
        score:
          chunk.similarity +
          (matched / terms.length) * 0.18 +
          phraseBonus(query, content),
      };
    })
    .sort((left, right) =>
      right.score === left.score
        ? left.index - right.index
        : right.score - left.score,
    )
    .map((entry) => entry.chunk);
}
