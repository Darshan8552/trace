export type RankedItem = { id: string };

export function mergeRanked<T extends RankedItem>(
  lists: T[][],
  { limit, k = 60 }: { limit: number; k?: number },
): T[] {
  const ranked = new Map<
    string,
    { item: T; score: number; firstSeen: number }
  >();
  let seen = 0;

  for (const list of lists) {
    list.forEach((item, index) => {
      const existing = ranked.get(item.id);

      if (existing) {
        existing.score += 1 / (k + index + 1);
        return;
      }

      ranked.set(item.id, {
        item,
        score: 1 / (k + index + 1),
        firstSeen: seen,
      });
      seen += 1;
    });
  }

  return [...ranked.values()]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.firstSeen - right.firstSeen;
    })
    .slice(0, limit)
    .map((entry) => entry.item);
}
