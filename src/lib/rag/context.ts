export type ContextDocument = {
  id: string;
  title: string;
};

export type ContextChunk = {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  page: number | null;
  position: number;
  similarity: number;
  before?: string;
  after?: string;
};

export type NumberedChunk = ContextChunk & { number: number };

export type DocumentGroup = {
  document: ContextDocument;
  chunks: NumberedChunk[];
};

export function groupChunksByDocument(
  documents: ContextDocument[],
  chunks: NumberedChunk[],
): DocumentGroup[] {
  const byDocument = new Map<string, NumberedChunk[]>();

  for (const chunk of chunks) {
    const list = byDocument.get(chunk.documentId);

    if (list) {
      list.push(chunk);
    } else {
      byDocument.set(chunk.documentId, [chunk]);
    }
  }

  const groups: DocumentGroup[] = [];
  const known = new Set(documents.map((document) => document.id));

  for (const document of documents) {
    const list = byDocument.get(document.id);

    if (!list || list.length === 0) {
      continue;
    }

    groups.push({
      document,
      chunks: [...list].sort((left, right) => left.position - right.position),
    });
  }

  for (const [documentId, list] of byDocument) {
    if (known.has(documentId)) {
      continue;
    }

    groups.push({
      document: { id: documentId, title: list[0]?.documentTitle ?? "Source" },
      chunks: [...list].sort((left, right) => left.position - right.position),
    });
  }

  return groups;
}

function truncateContent(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content;
  }

  if (maxChars <= 1) {
    return content.slice(0, maxChars);
  }

  const slice = content.slice(0, maxChars - 1);
  const boundary = slice.lastIndexOf(" ");
  const cut = boundary > maxChars * 0.6 ? boundary : slice.length;

  return `${slice.slice(0, cut).trimEnd()}\u2026`;
}

export function selectCoverageChunks(
  chunks: ContextChunk[],
  { perDocument, maxChars }: { perDocument: number; maxChars: number },
): ContextChunk[] {
  const byDocument = new Map<string, ContextChunk[]>();

  for (const chunk of chunks) {
    const list = byDocument.get(chunk.documentId);

    if (list) {
      list.push(chunk);
    } else {
      byDocument.set(chunk.documentId, [chunk]);
    }
  }

  for (const list of byDocument.values()) {
    list.sort((left, right) => right.similarity - left.similarity);
  }

  const documents = [...byDocument.values()];
  const selected: ContextChunk[] = [];
  let used = 0;

  for (let round = 0; round < perDocument; round += 1) {
    for (const [index, list] of documents.entries()) {
      const chunk = list[round];

      if (!chunk) {
        continue;
      }

      const remaining = maxChars - used;

      if (remaining <= 0) {
        break;
      }

      const content =
        round === 0
          ? truncateContent(
              chunk.content,
              Math.floor(remaining / (documents.length - index)),
            )
          : chunk.content;

      if (!content || content.length > remaining) {
        continue;
      }

      selected.push({ ...chunk, content });
      used += content.length;
    }

    if (used >= maxChars) {
      break;
    }
  }

  return selected;
}
