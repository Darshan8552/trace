import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin/access";
import { rateLimitedResponse } from "@/lib/api-response";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { retryPendingBlobDeletions } from "@/lib/storage/cleanup";

export const maxDuration = 60;

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminUser(session.user)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "admin:blob-deletions"),
    limit: 5,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const result = await retryPendingBlobDeletions();

  return NextResponse.json(result);
}
