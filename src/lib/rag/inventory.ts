export type InventoryDocument = {
  id: string;
  title: string;
};

export function buildInventoryAnswer(
  documents: InventoryDocument[],
  indexedIds: Set<string>,
): string {
  if (documents.length === 0) {
    return "This notebook has no sources yet. Add one from the Sources panel to get started.";
  }

  const indexed = documents.filter((document) => indexedIds.has(document.id));
  const missing = documents.filter((document) => !indexedIds.has(document.id));
  const total =
    documents.length === 1 ? "1 source" : `${documents.length} sources`;
  const indexedLabel =
    indexed.length === documents.length
      ? "all indexed"
      : `${indexed.length} indexed`;

  const lines = documents.map(
    (document, index) => `${index + 1}. ${document.title}`,
  );

  const parts = [`This notebook has ${total} (${indexedLabel}):`, "", ...lines];

  if (missing.length > 0) {
    parts.push(
      "",
      `Not indexed with the current model: ${missing
        .map((document) => document.title)
        .join(", ")}.`,
    );
  }

  return parts.join("\n");
}
