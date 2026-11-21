import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { deleteAccountSchema } from "@/lib/account/schemas";
import { rateLimitedResponse } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { removeOrEnqueue } from "@/lib/storage/cleanup";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "account:delete"),
    limit: 5,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const credential = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { id: true },
  });

  if (credential) {
    if (!parsed.data.password) {
      return NextResponse.json(
        { error: "Enter your password to delete this account." },
        { status: 400 },
      );
    }

    try {
      await auth.api.verifyPassword({
        body: { password: parsed.data.password },
        headers: await headers(),
      });
    } catch {
      return NextResponse.json(
        { error: "That password is not correct." },
        { status: 400 },
      );
    }
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    select: { storageKey: true },
  });

  await Promise.all(
    documents.map((document) => removeOrEnqueue(document.storageKey)),
  );

  await prisma.user.delete({ where: { id: session.user.id } });

  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete("better-auth.session_token");
  response.cookies.delete("__Secure-better-auth.session_token");
  return response;
}
