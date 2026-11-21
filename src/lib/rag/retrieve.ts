import "server-only";
import { MAX_DOCUMENTS_PER_CHAT } from "@/lib/documents/upload";
import { llmConfig } from "@/lib/llm/config";
import { embedQuery } from "@/lib/llm/embed";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { selectCoverageChunks } from "./context";
import { CORPUS_MAX_CHARS } from "./corpus";
import { isDocumentOverviewQuery } from "./intents";
import { mergeRanked } from "./merge";
import { rerankChunks } from "./rerank";
import { attachContextWindows } from "./window";

export type RetrievedChunk = {
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

export type IndexedDocument = {
  id: string;
  title: string;
};

export type RetrieveChunksInput = {
  userId: string;
  chatId: string;
  query: string;
  limit?: number;
};

type ChunkRow = {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  page: number | null;
  position: number;
  similarity: number;
};

const DEFAULT_LIMIT = 6;
const VECTOR_CANDIDATES = 30;
const KEYWORD_CANDIDATES = 30;
const COVERAGE_PER_DOCUMENT = 2;
const RRF_K = 60;
const STRICT_MIN_SIMILARITY = 0.55;
const OVERVIEW_MIN_SIMILARITY = 0.45;

function vectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

export async function listSearchableDocuments(
  userId: string,
  chatId: string,
): Promise<IndexedDocument[]> {
  const { embedding } = llmConfig();

  return prisma.document.findMany({
    where: {
      userId,
      chatId,
      status: "READY",
      embeddingProvider: embedding.provider,
      embeddingModel: embedding.model,
      embeddingDimensions: embedding.dimensions,
    },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
    take: MAX_DOCUMENTS_PER_CHAT,
  });
}

async function vectorSearch(
  input: RetrieveChunksInput,
  vector: string,
  limit: number,
) {
  const { embedding } = llmConfig();

  return prisma.$queryRaw<ChunkRow[]>`
    SELECT
      c."id",
      c."documentId",
      d."title" AS "documentTitle",
      c."content",
      c."page",
      c."position",
      (1 - (c."embedding" <=> ${vector}::vector))::float8 AS "similarity"
    FROM "chunk" c
    INNER JOIN "document" d ON d."id" = c."documentId"
    WHERE d."userId" = ${input.userId}
      AND d."chatId" = ${input.chatId}
      AND d."status" = 'READY'
      AND c."embedding" IS NOT NULL
      AND d."embeddingProvider" = ${embedding.provider}
      AND d."embeddingModel" = ${embedding.model}
      AND d."embeddingDimensions" = ${embedding.dimensions}
    ORDER BY c."embedding" <=> ${vector}::vector
    LIMIT ${limit}
  `;
}

async function keywordSearch(
  input: RetrieveChunksInput,
  vector: string,
  limit: number,
) {
  const { embedding } = llmConfig();

  return prisma.$queryRaw<ChunkRow[]>`
    WITH search AS (
      SELECT websearch_to_tsquery('simple', ${input.query}) AS query
    )
    SELECT
      c."id",
      c."documentId",
      d."title" AS "documentTitle",
      c."content",
      c."page",
      c."position",
      (
        1 - (c."embedding" <=> ${vector}::vector)
      )::float8 AS "similarity"
    FROM "chunk" c
    INNER JOIN "document" d ON d."id" = c."documentId"
    CROSS JOIN search
    WHERE d."userId" = ${input.userId}
      AND d."chatId" = ${input.chatId}
      AND d."status" = 'READY'
      AND c."embedding" IS NOT NULL
      AND d."embeddingProvider" = ${embedding.provider}
      AND d."embeddingModel" = ${embedding.model}
      AND d."embeddingDimensions" = ${embedding.dimensions}
      AND to_tsvector('simple', c."content") @@ search.query
    ORDER BY ts_rank_cd(to_tsvector('simple', c."content"), search.query) DESC
    LIMIT ${limit}
  `;
}

async function coverageSearch(
  input: RetrieveChunksInput,
  vector: string,
  perDocument: number,
) {
  const { embedding } = llmConfig();

  return prisma.$queryRaw<ChunkRow[]>`
    SELECT
      ranked."id",
      ranked."documentId",
      ranked."documentTitle",
      ranked."content",
      ranked."page",
      ranked."position",
      ranked."similarity"
    FROM (
      SELECT
        c."id",
        c."documentId",
        d."title" AS "documentTitle",
        c."content",
        c."page",
        c."position",
        (1 - (c."embedding" <=> ${vector}::vector))::float8 AS "similarity",
        ROW_NUMBER() OVER (
          PARTITION BY c."documentId"
          ORDER BY c."embedding" <=> ${vector}::vector
        ) AS "rank"
      FROM "chunk" c
      INNER JOIN "document" d ON d."id" = c."documentId"
      WHERE d."userId" = ${input.userId}
        AND d."chatId" = ${input.chatId}
        AND d."status" = 'READY'
        AND c."embedding" IS NOT NULL
        AND d."embeddingProvider" = ${embedding.provider}
        AND d."embeddingModel" = ${embedding.model}
        AND d."embeddingDimensions" = ${embedding.dimensions}
    ) ranked
    WHERE ranked."rank" <= ${perDocument}
    ORDER BY ranked."documentId", ranked."rank"
  `;
}

async function neighboringChunks(chunks: RetrievedChunk[]) {
  const rows = await Promise.all(
    chunks.map((chunk) =>
      prisma.chunk.findMany({
        where: {
          documentId: chunk.documentId,
          id: { not: chunk.id },
          position: { gte: chunk.position - 1, lte: chunk.position + 1 },
        },
        select: {
          documentId: true,
          position: true,
          content: true,
          page: true,
        },
        orderBy: { position: "asc" },
        take: 2,
      }),
    ),
  );

  return rows.flat();
}

export async function retrieveCoverageChunks(
  input: RetrieveChunksInput,
): Promise<RetrievedChunk[]> {
  const searchableDocuments = await listSearchableDocuments(
    input.userId,
    input.chatId,
  );

  if (searchableDocuments.length === 0) {
    return [];
  }

  const vector = vectorLiteral(await embedQuery(input.query));
  const [coverageRows, keywordRows] = await Promise.all([
    coverageSearch(input, vector, COVERAGE_PER_DOCUMENT),
    keywordSearch(input, vector, KEYWORD_CANDIDATES).catch((error: unknown) => {
      logError("rag.keyword-retrieval", error);
      return [] as ChunkRow[];
    }),
  ]);

  const unique = new Map<string, ChunkRow>();

  for (const row of [...coverageRows, ...keywordRows]) {
    if (!unique.has(row.id)) {
      unique.set(row.id, row);
    }
  }

  const selected = rerankChunks(
    selectCoverageChunks([...unique.values()], {
      perDocument: COVERAGE_PER_DOCUMENT,
      maxChars: CORPUS_MAX_CHARS,
    }),
    input.query,
  );

  return attachContextWindows(selected, await neighboringChunks(selected));
}

export async function retrieveChunks(
  input: RetrieveChunksInput,
): Promise<RetrievedChunk[]> {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const searchableDocuments = await listSearchableDocuments(
    input.userId,
    input.chatId,
  );

  if (searchableDocuments.length === 0) {
    return [];
  }

  const vector = vectorLiteral(await embedQuery(input.query));
  const [vectorRows, keywordRows] = await Promise.all([
    vectorSearch(input, vector, VECTOR_CANDIDATES),
    keywordSearch(input, vector, KEYWORD_CANDIDATES).catch((error: unknown) => {
      logError("rag.keyword-retrieval", error);
      return [] as ChunkRow[];
    }),
  ]);

  const merged = mergeRanked([vectorRows, keywordRows], {
    limit: limit * 2,
    k: RRF_K,
  });

  const strictMatches = merged
    .filter((row) => row.similarity >= STRICT_MIN_SIMILARITY)
    .slice(0, limit);

  if (strictMatches.length > 0) {
    return rerankChunks(strictMatches, input.query);
  }

  if (isDocumentOverviewQuery(input.query)) {
    return rerankChunks(
      merged
        .filter((row) => row.similarity >= OVERVIEW_MIN_SIMILARITY)
        .slice(0, limit),
      input.query,
    );
  }

  return [];
}
