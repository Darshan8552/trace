export type WindowNeighbor = {
  documentId: string;
  position: number;
  content: string;
  page: number | null;
};

export type Windowed<T> = T & {
  before?: string;
  after?: string;
};

function excerpt(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content;
  }

  return `${content.slice(0, Math.max(0, maxChars - 1)).trimEnd()}\u2026`;
}

function label(neighbor: WindowNeighbor): string {
  return neighbor.page ? `p. ${neighbor.page}: ` : "";
}

export function attachContextWindows<
  T extends { documentId: string; position: number },
>(
  chunks: T[],
  neighbors: WindowNeighbor[],
  { maxChars = 900 }: { maxChars?: number } = {},
): Windowed<T>[] {
  const byPosition = new Map<string, WindowNeighbor>();

  for (const neighbor of neighbors) {
    const key = `${neighbor.documentId}:${neighbor.position}`;

    if (!byPosition.has(key) && neighbor.content.trim()) {
      byPosition.set(key, neighbor);
    }
  }

  return chunks.map((chunk) => {
    const before = byPosition.get(`${chunk.documentId}:${chunk.position - 1}`);
    const after = byPosition.get(`${chunk.documentId}:${chunk.position + 1}`);

    return {
      ...chunk,
      ...(before
        ? { before: `${label(before)}${excerpt(before.content, maxChars)}` }
        : {}),
      ...(after
        ? { after: `${label(after)}${excerpt(after.content, maxChars)}` }
        : {}),
    };
  });
}
