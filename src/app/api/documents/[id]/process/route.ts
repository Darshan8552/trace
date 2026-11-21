import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import {
  documentIdSchema,
  processDocumentSchema,
} from "@/lib/documents/schemas";
import {
  DocumentNotFoundError,
  processDocument,
} from "@/lib/rag/process-document";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "documents:process"),
    limit: 180,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const parsedId = documentIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = processDocumentSchema.safeParse(body ?? {});

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await processDocument({
      documentId: parsedId.data,
      userId: session.user.id,
      reindex: parsedBody.data.reindex ?? false,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DocumentNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "This document could not be indexed.",
      },
      { status: 422 },
    );
  }
}
