import "server-only";
import { prisma } from "@/lib/prisma";
import type { SearchResults, SearchSource } from "./types";

const HEADLINE_OPTIONS =
  "StartSel=«, StopSel=», MaxFragments=1, MaxWords=32, MinWords=8";

type AnswerRow = {
  chatId: string;
  chatTitle: string;
  messageId: string;
  snippet: string;
};

type SourceRow = {
  chatId: string;
  chatTitle: string;
  documentId: string;
  documentTitle: string;
  chunkId: string;
  page: number | null;
  snippet: string;
};

export async function searchWorkspace(
  userId: string,
  query: string,
): Promise<SearchResults> {
  const notebooks = await prisma.chat.findMany({
    where: {
      userId,
      title: { contains: query, mode: "insensitive" },
    },
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const answers = await prisma.$queryRaw<AnswerRow[]>`
    SELECT
      c."id" AS "chatId",
      c."title" AS "chatTitle",
      m."externalId" AS "messageId",
      ts_headline('simple', m."content", websearch_to_tsquery('simple', ${query}), ${HEADLINE_OPTIONS}) AS "snippet"
    FROM "chat_message" m
    INNER JOIN "chat" c ON c."id" = m."chatId"
    WHERE c."userId" = ${userId}
      AND to_tsvector('simple', m."content") @@ websearch_to_tsquery('simple', ${query})
    ORDER BY ts_rank_cd(to_tsvector('simple', m."content"), websearch_to_tsquery('simple', ${query})) DESC
    LIMIT 8
  `;

  const chunkRows = await prisma.$queryRaw<SourceRow[]>`
    SELECT
      c."id" AS "chatId",
      c."title" AS "chatTitle",
      d."id" AS "documentId",
      d."title" AS "documentTitle",
      ch."id" AS "chunkId",
      ch."page" AS "page",
      ts_headline('simple', ch."content", websearch_to_tsquery('simple', ${query}), ${HEADLINE_OPTIONS}) AS "snippet"
    FROM "chunk" ch
    INNER JOIN "document" d ON d."id" = ch."documentId"
    INNER JOIN "chat" c ON c."id" = d."chatId"
    WHERE c."userId" = ${userId}
      AND to_tsvector('simple', ch."content") @@ websearch_to_tsquery('simple', ${query})
    ORDER BY ts_rank_cd(to_tsvector('simple', ch."content"), websearch_to_tsquery('simple', ${query})) DESC
    LIMIT 30
  `;

  const seen = new Set<string>();
  const sources: SearchSource[] = [];

  for (const row of chunkRows) {
    if (seen.has(row.documentId)) {
      continue;
    }

    seen.add(row.documentId);
    sources.push(row);
  }

  return {
    notebooks: notebooks.map((chat) => ({
      id: chat.id,
      title: chat.title,
      updatedAt: chat.updatedAt.toISOString(),
    })),
    answers,
    sources: sources.slice(0, 8),
  };
}
