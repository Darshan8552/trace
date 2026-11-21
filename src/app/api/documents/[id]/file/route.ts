import { NextResponse } from "next/server";
import { documentIdSchema } from "@/lib/documents/schemas";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getStorage } from "@/lib/storage";

export async function GET(
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

  const blob = await getStorage().read(document.storageKey);

  if (!blob) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filename = document.filename.replace(/["\\]/g, "");

  return new Response(blob.stream, {
    headers: {
      "content-type": document.mimeType,
      "content-length": String(blob.size),
      "content-disposition": `inline; filename="${filename}"`,
      "cache-control": "private, max-age=0, must-revalidate",
    },
  });
}
