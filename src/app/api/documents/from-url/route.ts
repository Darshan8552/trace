import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import { hashText } from "@/lib/documents/hash-server";
import { createUrlDocumentSchema } from "@/lib/documents/schemas";
import { toDocumentSummary } from "@/lib/documents/serialize";
import {
  MAX_DOCUMENTS_PER_CHAT,
  titleForFilename,
} from "@/lib/documents/upload";
import { pageDocumentFilename, pageDocumentTitle } from "@/lib/documents/url";
import { type FetchedPage, fetchReadablePage } from "@/lib/ingest/url";
import { llmConfig } from "@/lib/llm/config";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { getStorage } from "@/lib/storage";
import { removeOrEnqueue } from "@/lib/storage/cleanup";
import type { StoredBlob } from "@/lib/storage/types";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "documents:url"),
    limit: 10,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const storage = getStorage();

  if (!storage.isConfigured()) {
    return NextResponse.json(
      { error: "File storage is not configured yet." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createUrlDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid web address." },
      { status: 400 },
    );
  }

  const { chatId } = parsed.data;
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: session.user.id },
    select: { id: true },
  });

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const documentCount = await prisma.document.count({ where: { chatId } });

  if (documentCount >= MAX_DOCUMENTS_PER_CHAT) {
    return NextResponse.json(
      {
        error: `This chat can hold up to ${MAX_DOCUMENTS_PER_CHAT} documents. Remove one before adding another.`,
      },
      { status: 409 },
    );
  }

  let page: FetchedPage;
  const pageUrl = parsed.data.url.trim();

  try {
    page = await fetchReadablePage(pageUrl);
  } catch (error) {
    logError("documents.fetch-url", error);

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

  const contentHash = hashText(page.text);
  const duplicate = await prisma.document.findFirst({
    where: { chatId, userId: session.user.id, sourceUrl: page.url },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "That page is already a source in this chat." },
      { status: 409 },
    );
  }

  const contentDuplicate = await prisma.document.findFirst({
    where: { chatId, userId: session.user.id, contentHash },
    select: { title: true },
  });

  if (contentDuplicate) {
    return NextResponse.json(
      {
        error: `The same text is already added as “${contentDuplicate.title}”.`,
        duplicate: true,
        existingTitle: contentDuplicate.title,
      },
      { status: 409 },
    );
  }

  const title = titleForFilename(pageDocumentTitle(page.url, page.title));
  const storageKey = `documents/${session.user.id}/${randomUUID()}.txt`;
  const { embedding } = llmConfig();

  let stored: StoredBlob;

  try {
    stored = await storage.put(
      storageKey,
      new TextEncoder().encode(page.text),
      "text/plain",
    );
  } catch (error) {
    logError("documents.store-url", error);

    return NextResponse.json(
      { error: "That page could not be saved." },
      { status: 500 },
    );
  }

  try {
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        chatId: chat.id,
        title,
        filename: pageDocumentFilename(title),
        mimeType: "text/plain",
        sizeBytes: stored.size,
        storageKey,
        sourceUrl: page.url,
        sourceCheckedAt: new Date(),
        contentHash,
        embeddingProvider: embedding.provider,
        embeddingModel: embedding.model,
        embeddingDimensions: embedding.dimensions,
      },
    });

    return NextResponse.json(
      { document: toDocumentSummary(document, embedding) },
      { status: 201 },
    );
  } catch (error) {
    logError("documents.create-url", error);
    await removeOrEnqueue(storageKey);

    return NextResponse.json(
      { error: "That page could not be saved." },
      { status: 500 },
    );
  }
}
