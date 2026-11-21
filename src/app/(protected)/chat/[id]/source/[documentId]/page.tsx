import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SourceViewerFallback } from "@/components/chat/chat-page-fallback";
import {
  SourceViewer,
  type SourceViewerChunk,
  type SourceViewerDocument,
} from "@/components/documents/source-viewer";
import { AppHeader } from "@/components/shell/app-header";
import { isAdminUser } from "@/lib/admin/access";
import { chatIdSchema } from "@/lib/chats/schemas";
import { documentIdSchema } from "@/lib/documents/schemas";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

async function SourceContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; documentId: string }>;
  searchParams: Promise<{ chunk?: string }>;
}) {
  const { user } = await requireSession();
  const { id, documentId } = await params;
  const { chunk } = await searchParams;
  const parsedChatId = chatIdSchema.safeParse(id);
  const parsedDocumentId = documentIdSchema.safeParse(documentId);

  if (!parsedChatId.success || !parsedDocumentId.success) {
    notFound();
  }

  const [chat, sourceDocument] = await Promise.all([
    prisma.chat.findFirst({
      where: { id: parsedChatId.data, userId: user.id },
      select: { id: true, title: true },
    }),
    prisma.document.findFirst({
      where: {
        id: parsedDocumentId.data,
        chatId: parsedChatId.data,
        userId: user.id,
      },
    }),
  ]);

  if (!chat || !sourceDocument) {
    notFound();
  }

  const chunks: SourceViewerChunk[] = await prisma.chunk.findMany({
    where: { documentId: sourceDocument.id },
    select: { id: true, position: true, page: true, content: true },
    orderBy: { position: "asc" },
  });

  const activeChunkId =
    typeof chunk === "string" && chunks.some((item) => item.id === chunk)
      ? chunk
      : null;

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
    <>
      <AppHeader
        user={user}
        variant="compact"
        className="lg:hidden"
        isAdmin={isAdminUser(user)}
      />
      <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <SourceViewer
          chatId={chat.id}
          chatTitle={chat.title}
          sourceDocument={document}
          chunks={chunks}
          activeChunkId={activeChunkId}
        />
      </main>
    </>
  );
}

export default function SourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; documentId: string }>;
  searchParams: Promise<{ chunk?: string }>;
}) {
  return (
    <Suspense fallback={<SourceViewerFallback />}>
      <SourceContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
