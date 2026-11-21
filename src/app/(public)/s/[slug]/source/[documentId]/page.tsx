import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SourceViewerFallback } from "@/components/chat/chat-page-fallback";
import {
  SourceViewer,
  type SourceViewerDocument,
} from "@/components/documents/source-viewer";
import { documentIdSchema } from "@/lib/documents/schemas";
import { prisma } from "@/lib/prisma";

const SLUG = /^[a-zA-Z0-9]{16,40}$/;

async function SharedSourceContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; documentId: string }>;
  searchParams: Promise<{ chunk?: string }>;
}) {
  const { slug, documentId } = await params;
  const { chunk } = await searchParams;

  await connection();

  if (!SLUG.test(slug) || !documentIdSchema.safeParse(documentId).success) {
    notFound();
  }

  const chat = await prisma.chat.findUnique({
    where: { shareSlug: slug },
    select: { id: true, title: true },
  });

  if (!chat) {
    notFound();
  }

  const sourceDocument = await prisma.document.findFirst({
    where: { id: documentId, chatId: chat.id },
  });

  if (!sourceDocument) {
    notFound();
  }

  const [chunks, cited] = await Promise.all([
    prisma.chunk.findMany({
      where: { documentId: sourceDocument.id },
      select: { id: true, position: true, page: true, content: true },
      orderBy: { position: "asc" },
    }),
    typeof chunk === "string"
      ? prisma.chunk.findFirst({
          where: { id: chunk, documentId: sourceDocument.id },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const document: SourceViewerDocument = {
    id: sourceDocument.id,
    title: sourceDocument.title,
    filename: sourceDocument.filename,
    mimeType: sourceDocument.mimeType,
    pageCount: sourceDocument.pageCount,
    status: sourceDocument.status,
    error: sourceDocument.error,
    sourceUrl: sourceDocument.sourceUrl,
  };

  return (
    <SourceViewer
      chatId={chat.id}
      chatTitle={chat.title}
      sourceDocument={document}
      chunks={chunks}
      activeChunkId={cited?.id ?? null}
      backHref={`/s/${slug}`}
      showOriginal={false}
    />
  );
}

export default function SharedSourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; documentId: string }>;
  searchParams: Promise<{ chunk?: string }>;
}) {
  return (
    <Suspense fallback={<SourceViewerFallback />}>
      <SharedSourceContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
