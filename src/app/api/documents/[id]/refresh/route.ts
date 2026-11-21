import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import { hashText } from "@/lib/documents/hash-server";
import { documentIdSchema } from "@/lib/documents/schemas";
import { toDocumentSummary } from "@/lib/documents/serialize";
import { titleForFilename } from "@/lib/documents/upload";
import { pageDocumentFilename, pageDocumentTitle } from "@/lib/documents/url";
import { type FetchedPage, fetchReadablePage } from "@/lib/ingest/url";
import { llmConfig } from "@/lib/llm/config";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/rag/process-document";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { getStorage } from "@/lib/storage";

export const maxDuration = 60;

const REFRESH_BUDGET_MS = 45_000;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "documents:refresh"),
    limit: 10,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const parsedId = documentIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const document = await prisma.document.findFirst({
    where: { id: parsedId.data, userId: session.user.id },
    select: {
      id: true,
      chatId: true,
      title: true,
      storageKey: true,
      sourceUrl: true,
      contentHash: true,
      status: true,
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!document.sourceUrl) {
    return NextResponse.json(
      { error: "Only web pages can be refreshed." },
      { status: 400 },
    );
  }

  let page: FetchedPage;

  try {
    page = await fetchReadablePage(document.sourceUrl);
  } catch (error) {
    logError("documents.refresh-fetch", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.startsWith("That ")
            ? error.message
            : "That page could not be loaded.",
      },
      { status: 400 },
    );
  }

  const checkedAt = new Date();
  const contentHash = hashText(page.text);

  if (contentHash === document.contentHash) {
    await prisma.document.update({
      where: { id: document.id },
      data: { sourceCheckedAt: checkedAt },
    });

    return NextResponse.json({ changed: false, status: document.status });
  }

  const storage = getStorage();

  if (!storage.isConfigured()) {
    return NextResponse.json(
      { error: "File storage is not configured yet." },
      { status: 503 },
    );
  }

  await storage.put(
    document.storageKey,
    new TextEncoder().encode(page.text),
    "text/plain",
  );

  const title = titleForFilename(pageDocumentTitle(page.url, page.title));

  await prisma.document.update({
    where: { id: document.id },
    data: {
      title,
      filename: pageDocumentFilename(title),
      sourceUrl: page.url,
      sourceCheckedAt: checkedAt,
      contentHash,
      pageCount: null,
      status: "PENDING",
      error: null,
    },
  });

  try {
    const result = await processDocument({
      documentId: document.id,
      userId: session.user.id,
      reindex: true,
      budgetMs: REFRESH_BUDGET_MS,
    });

    const updated = await prisma.document.findUnique({
      where: { id: document.id },
    });
    const { embedding } = llmConfig();

    return NextResponse.json({
      changed: true,
      status: result.status,
      document: updated ? toDocumentSummary(updated, embedding) : null,
    });
  } catch (error) {
    logError("documents.refresh-process", error);

    return NextResponse.json(
      { error: "The refreshed page could not be indexed." },
      { status: 422 },
    );
  }
}
