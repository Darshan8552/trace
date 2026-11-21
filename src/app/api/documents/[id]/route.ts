import { NextResponse } from "next/server";
import { documentIdSchema } from "@/lib/documents/schemas";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { removeOrEnqueue } from "@/lib/storage/cleanup";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = documentIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const document = await prisma.document.findFirst({
    where: { id: parsedId.data, userId: session.user.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await removeOrEnqueue(document.storageKey);
  await prisma.document.delete({ where: { id: document.id } });

  return new NextResponse(null, { status: 204 });
}
