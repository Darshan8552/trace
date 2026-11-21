import { NextResponse } from "next/server";
import { hasMachineAccess, isAdminUser } from "@/lib/admin/access";
import { reindexRequestSchema } from "@/lib/admin/schemas";
import { rateLimitedResponse } from "@/lib/api-response";
import {
  findReindexCandidates,
  runReindex,
  summarizeCandidates,
} from "@/lib/rag/reindex";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

export async function POST(request: Request) {
  const machine = hasMachineAccess(request.headers.get("authorization"));
  const session = machine ? null : await getSession();

  if (!machine && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !isAdminUser(session.user)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const limit = await rateLimit({
    key: session
      ? userRateLimitKey(session.user.id, "admin:reindex")
      : "admin:reindex:machine",
    limit: 10,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const body = await request.json().catch(() => null);
  const parsed = reindexRequestSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const candidates = await findReindexCandidates({
    userId: parsed.data.userId,
    chatId: parsed.data.chatId,
    limit: parsed.data.limit,
  });
  const totals = summarizeCandidates(candidates);

  if (parsed.data.dryRun ?? true) {
    return NextResponse.json({ dryRun: true, totals, candidates });
  }

  const { results, remaining } = await runReindex({ candidates });

  return NextResponse.json({ dryRun: false, totals, results, remaining });
}
