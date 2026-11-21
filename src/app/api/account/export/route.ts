import { NextResponse } from "next/server";
import { buildAccountExport } from "@/lib/account/export";
import { rateLimitedResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "account:export"),
    limit: 10,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const [user, chats, documents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
    prisma.chat.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        titleIsAuto: true,
        shareSlug: true,
        shareCreatedAt: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            role: true,
            content: true,
            sources: true,
            createdAt: true,
            feedback: {
              select: {
                rating: true,
                reason: true,
                note: true,
                createdAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        chatId: true,
        title: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        pageCount: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const exportedAt = new Date();
  const filename = `trace-export-${exportedAt.toISOString().slice(0, 10)}.json`;

  return new NextResponse(
    JSON.stringify(
      buildAccountExport({ user, chats, documents, exportedAt }),
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    },
  );
}
