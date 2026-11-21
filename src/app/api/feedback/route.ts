import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import {
  feedbackDeleteSchema,
  feedbackRequestSchema,
} from "@/lib/feedback/schemas";
import {
  type FeedbackSummary,
  ratingLabel,
  ratingValue,
} from "@/lib/feedback/types";
import { prisma } from "@/lib/prisma";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

async function ownedMessageId(
  userId: string,
  chatId: string,
  externalId: string,
) {
  const message = await prisma.chatMessage.findFirst({
    where: { externalId, chatId, chat: { userId } },
    select: { id: true },
  });

  return message?.id ?? null;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "feedback:write"),
    limit: 30,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const body = await request.json().catch(() => null);
  const parsed = feedbackRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { chatId, messageId, rating, reason, note } = parsed.data;
  const ownedId = await ownedMessageId(session.user.id, chatId, messageId);

  if (!ownedId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const saved = await prisma.messageFeedback.upsert({
    where: { messageId: ownedId },
    create: {
      messageId: ownedId,
      userId: session.user.id,
      rating: ratingValue(rating),
      reason: reason ?? null,
      note: note ?? null,
    },
    update: {
      rating: ratingValue(rating),
      reason: reason ?? null,
      note: note ?? null,
    },
  });

  const feedback: FeedbackSummary = {
    rating: ratingLabel(saved.rating),
    reason: saved.reason as FeedbackSummary["reason"],
    note: saved.note,
  };

  return NextResponse.json({ feedback });
}

export async function DELETE(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = feedbackDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { chatId, messageId } = parsed.data;
  const ownedId = await ownedMessageId(session.user.id, chatId, messageId);

  if (ownedId) {
    await prisma.messageFeedback.deleteMany({
      where: { messageId: ownedId, userId: session.user.id },
    });
  }

  return new NextResponse(null, { status: 204 });
}
