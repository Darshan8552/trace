import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import { listChatSummaries } from "@/lib/chats/queries";
import { createChatSchema } from "@/lib/chats/schemas";
import { DEFAULT_CHAT_TITLE, toChatSummary } from "@/lib/chats/serialize";
import { prisma } from "@/lib/prisma";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chats = await listChatSummaries(session.user.id);

  return NextResponse.json({ chats });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "chats:create"),
    limit: 20,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const body = await request.json().catch(() => null);
  const parsed = createChatSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const chat = await prisma.chat.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title ?? DEFAULT_CHAT_TITLE,
    },
  });

  return NextResponse.json(
    {
      chat: toChatSummary({
        ...chat,
        messages: [],
        _count: { messages: 0, documents: 0 },
      }),
    },
    { status: 201 },
  );
}
