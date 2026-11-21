import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import { DEMO_CHAT_TITLE, DEMO_SOURCES } from "@/lib/demo/sources";
import { logError } from "@/lib/log";
import { SeedStorageUnavailable, seedNotebook } from "@/lib/notebooks/seed";
import { prisma } from "@/lib/prisma";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "notebooks:demo"),
    limit: 3,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const existing = await prisma.chat.findFirst({
    where: {
      userId: session.user.id,
      title: DEMO_CHAT_TITLE,
      titleIsAuto: false,
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({
      chatId: existing.id,
      existing: true,
      processed: 0,
      pending: 0,
    });
  }

  try {
    const seeded = await seedNotebook({
      userId: session.user.id,
      title: DEMO_CHAT_TITLE,
      scope: "notebooks.demo",
      directory: "demo",
      sources: DEMO_SOURCES,
    });

    return NextResponse.json({
      chatId: seeded.chatId,
      existing: false,
      processed: seeded.processed,
      pending: seeded.pending,
    });
  } catch (error) {
    if (error instanceof SeedStorageUnavailable) {
      return NextResponse.json(
        { error: "File storage is not configured yet." },
        { status: 503 },
      );
    }

    logError("notebooks.demo", error, { userId: session.user.id });

    return NextResponse.json(
      { error: "The demo notebook could not be created." },
      { status: 500 },
    );
  }
}
