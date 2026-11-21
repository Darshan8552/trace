import { NextResponse } from "next/server";
import { chatIdSchema, updateChatSchema } from "@/lib/chats/schemas";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { removeOrEnqueue } from "@/lib/storage/cleanup";

export async function PATCH(
  request: Request,
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

  const body = await request.json().catch(() => null);
  const parsedUpdate = updateChatSchema.safeParse(body ?? {});

  if (!parsedUpdate.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { title, pinned } = parsedUpdate.data;
  const data: { title?: string; titleIsAuto?: boolean; isPinned?: boolean } =
    {};

  if (title !== undefined) {
    data.title = title;
    data.titleIsAuto = false;
  }

  if (pinned !== undefined) {
    data.isPinned = pinned;
  }

  const { count } = await prisma.chat.updateMany({
    where: { id: parsedId.data, userId: session.user.id },
    data,
  });

  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    chat: {
      id: parsedId.data,
      ...(title !== undefined ? { title } : {}),
      ...(pinned !== undefined ? { isPinned: pinned } : {}),
    },
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

  const chat = await prisma.chat.findFirst({
    where: { id: parsedId.data, userId: session.user.id },
    select: {
      id: true,
      documents: { select: { storageKey: true } },
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await Promise.all(
    chat.documents.map((document) => removeOrEnqueue(document.storageKey)),
  );

  await prisma.chat.delete({ where: { id: chat.id } });

  return new NextResponse(null, { status: 204 });
}
