import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import { chatIdSchema } from "@/lib/chats/schemas";
import { prisma } from "@/lib/prisma";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { newShareSlug } from "@/lib/share/slug";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "chats:share"),
    limit: 10,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const parsedId = chatIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chat = await prisma.chat.findFirst({
    where: { id: parsedId.data, userId: session.user.id },
    select: { id: true, shareSlug: true },
  });

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let slug = chat.shareSlug;

  if (!slug) {
    slug = newShareSlug();

    await prisma.chat.updateMany({
      where: { id: chat.id, shareSlug: null },
      data: { shareSlug: slug, shareCreatedAt: new Date() },
    });
  }

  return NextResponse.json({
    slug,
    url: new URL(`/s/${slug}`, request.url).toString(),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = chatIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chat.updateMany({
    where: { id: parsedId.data, userId: session.user.id },
    data: { shareSlug: null, shareCreatedAt: null },
  });

  return new NextResponse(null, { status: 204 });
}
