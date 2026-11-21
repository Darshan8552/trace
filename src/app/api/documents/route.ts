import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import { isOwnedStorageKey } from "@/lib/documents/paths";
import {
  createDocumentSchema,
  documentListQuerySchema,
} from "@/lib/documents/schemas";
import { toDocumentSummary } from "@/lib/documents/serialize";
import {
  ACCEPTED_MIME_TYPES,
  isSpreadsheetMime,
  MAX_DOCUMENTS_PER_CHAT,
  MAX_UPLOAD_BYTES,
  titleForFilename,
} from "@/lib/documents/upload";
import { serverEnv } from "@/lib/env";
import { llmConfig } from "@/lib/llm/config";
import { prisma } from "@/lib/prisma";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { getStorage } from "@/lib/storage";
import { removeOrEnqueue } from "@/lib/storage/cleanup";

function normalizeContentType(contentType: string): string {
  return (contentType.split(";")[0] ?? contentType).trim().toLowerCase();
}

async function rejectUpload(
  pathname: string,
  body: Record<string, unknown>,
  status: number,
) {
  await removeOrEnqueue(pathname);

  return NextResponse.json(body, { status });
}

async function ownedChat(userId: string, chatId: string) {
  return prisma.chat.findFirst({
    where: { id: chatId, userId },
    select: { id: true },
  });
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedQuery = documentListQuerySchema.safeParse({
    chatId: new URL(request.url).searchParams.get("chatId"),
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const chat = await ownedChat(session.user.id, parsedQuery.data.chatId);

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id, chatId: chat.id },
    orderBy: { createdAt: "desc" },
  });

  const { embedding } = llmConfig();

  return NextResponse.json({
    documents: documents.map((document) =>
      toDocumentSummary(document, embedding),
    ),
  });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "documents:register"),
    limit: 40,
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
  const parsed = createDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { chatId, pathname, filename, title, contentHash } = parsed.data;

  if (!isOwnedStorageKey(session.user.id, pathname)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chat = await ownedChat(session.user.id, chatId);

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await storage.stat(pathname);

  if (!blob) {
    return NextResponse.json(
      { error: "That upload did not finish." },
      { status: 404 },
    );
  }

  const mimeType = normalizeContentType(blob.contentType);

  if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
    return rejectUpload(
      pathname,
      { error: "That file type is not supported." },
      400,
    );
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    return rejectUpload(pathname, { error: "That file is too large." }, 400);
  }

  if (isSpreadsheetMime(mimeType) && !serverEnv().INGEST_SPREADSHEETS) {
    return rejectUpload(
      pathname,
      { error: "Spreadsheet sources are not enabled yet." },
      400,
    );
  }

  const safeFilename = filename.split(/[\\/]/).pop() || filename;
  const { embedding } = llmConfig();
  const existing = await prisma.document.findUnique({
    where: { storageKey: pathname },
  });

  if (existing) {
    if (existing.userId !== session.user.id || existing.chatId !== chat.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      document: toDocumentSummary(existing, embedding),
    });
  }

  const documentCount = await prisma.document.count({
    where: { chatId: chat.id },
  });

  if (documentCount >= MAX_DOCUMENTS_PER_CHAT) {
    return rejectUpload(
      pathname,
      {
        error: `This chat can hold up to ${MAX_DOCUMENTS_PER_CHAT} documents. Remove one before adding another.`,
      },
      409,
    );
  }

  if (contentHash) {
    const duplicate = await prisma.document.findFirst({
      where: {
        userId: session.user.id,
        chatId: chat.id,
        contentHash,
      },
      select: { title: true },
    });

    if (duplicate) {
      return rejectUpload(
        pathname,
        {
          error: `Already added as “${duplicate.title}”. Remove it to add this file again.`,
          duplicate: true,
          existingTitle: duplicate.title,
        },
        409,
      );
    }
  }

  const document = await prisma.document
    .create({
      data: {
        userId: session.user.id,
        chatId: chat.id,
        title: title ?? titleForFilename(safeFilename),
        filename: safeFilename,
        mimeType,
        sizeBytes: blob.size,
        storageKey: pathname,
        contentHash,
        embeddingProvider: embedding.provider,
        embeddingModel: embedding.model,
        embeddingDimensions: embedding.dimensions,
      },
    })
    .catch(async (error) => {
      await removeOrEnqueue(pathname);
      throw error;
    });

  return NextResponse.json(
    { document: toDocumentSummary(document, embedding) },
    { status: 201 },
  );
}
