import "server-only";
import { embedMany } from "ai";
import { getEmbeddingDimensions, getEmbeddingModel } from "./models";

type EmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

async function embedValues(
  values: string[],
  taskType: EmbeddingTask,
): Promise<number[][]> {
  if (values.length === 0) {
    return [];
  }

  const dimensions = getEmbeddingDimensions();
  const { embeddings } = await embedMany({
    model: getEmbeddingModel(),
    values,
    dimensions,
    maxParallelCalls: 2,
    providerOptions: { google: { taskType } },
  });

  for (const embedding of embeddings) {
    if (embedding.length !== dimensions) {
      throw new Error(
        `Embedding model returned ${embedding.length} dimensions, expected ${dimensions}.`,
      );
    }
  }

  return embeddings;
}

export function embedDocuments(values: string[]): Promise<number[][]> {
  return embedValues(values, "RETRIEVAL_DOCUMENT");
}

export async function embedQuery(query: string): Promise<number[]> {
  const [embedding] = await embedValues([query], "RETRIEVAL_QUERY");

  if (!embedding) {
    throw new Error("The query could not be embedded.");
  }

  return embedding;
}
