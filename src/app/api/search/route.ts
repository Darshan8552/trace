import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitedResponse } from "@/lib/api-response";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { searchWorkspace } from "@/lib/search/queries";
import { EMPTY_SEARCH_RESULTS } from "@/lib/search/types";
import { getSession } from "@/lib/session";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "search"),
    limit: 30,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const parsed = searchQuerySchema.safeParse({
    q: new URL(request.url).searchParams.get("q"),
  });

  if (!parsed.success) {
    return NextResponse.json(EMPTY_SEARCH_RESULTS);
  }

  const results = await searchWorkspace(session.user.id, parsed.data.q);

  return NextResponse.json(results);
}
