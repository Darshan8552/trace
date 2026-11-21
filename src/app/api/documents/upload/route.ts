import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import { isOwnedStorageKey } from "@/lib/documents/paths";
import { MAX_UPLOAD_BYTES, uploadPolicy } from "@/lib/documents/upload";
import { serverEnv } from "@/lib/env";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { getStorage } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "documents:upload"),
    limit: 40,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  if (!getStorage().isConfigured()) {
    return NextResponse.json(
      { error: "File storage is not configured yet." },
      { status: 503 },
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as HandleUploadBody | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { mimeTypes } = uploadPolicy(serverEnv().INGEST_SPREADSHEETS);

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isOwnedStorageKey(session.user.id, pathname)) {
          throw new Error("That upload location is not available.");
        }

        return {
          allowedContentTypes: mimeTypes,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The upload could not start.",
      },
      { status: 400 },
    );
  }
}
