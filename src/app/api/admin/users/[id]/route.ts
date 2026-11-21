import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin/access";
import { adminUserIdSchema, adminUserUpdateSchema } from "@/lib/admin/schemas";
import { rateLimitedResponse } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { removeOrEnqueue } from "@/lib/storage/cleanup";

export const maxDuration = 30;

const PLUGIN_ROLE_REQUIRED =
  "Your account is allowlisted but has no admin role. Run pnpm admin:grant for this email, then sign in again.";

function failure(
  error: unknown,
  scope: string,
  context: Record<string, string>,
) {
  if (isAPIError(error)) {
    return NextResponse.json(
      { error: error.message || "The action could not be completed." },
      { status: error.statusCode ?? 400 },
    );
  }

  logError(scope, error, context);

  return NextResponse.json(
    { error: "The action could not be completed." },
    { status: 500 },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminUser(session.user)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: PLUGIN_ROLE_REQUIRED }, { status: 403 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "admin:users:update"),
    limit: 20,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const parsedId = adminUserIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsedId.data === session.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role or ban status." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = adminUserUpdateSchema.safeParse(body ?? {});

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const requestHeaders = await headers();
  const context = {
    targetUserId: parsedId.data,
    adminId: session.user.id,
  };

  try {
    if (parsedBody.data.role) {
      await auth.api.setRole({
        body: { userId: parsedId.data, role: parsedBody.data.role },
        headers: requestHeaders,
      });
    }

    if (parsedBody.data.banned === true) {
      await auth.api.banUser({
        body: {
          userId: parsedId.data,
          banReason: parsedBody.data.banReason || undefined,
        },
        headers: requestHeaders,
      });
    } else if (parsedBody.data.banned === false) {
      await auth.api.unbanUser({
        body: { userId: parsedId.data },
        headers: requestHeaders,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error, "admin.user.update", context);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminUser(session.user)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: PLUGIN_ROLE_REQUIRED }, { status: 403 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "admin:users:delete"),
    limit: 10,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const parsedId = adminUserIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsedId.data === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account here." },
      { status: 400 },
    );
  }

  const context = {
    targetUserId: parsedId.data,
    adminId: session.user.id,
  };

  try {
    const documents = await prisma.document.findMany({
      where: { userId: parsedId.data },
      select: { storageKey: true },
    });

    await Promise.all(
      documents.map((document) => removeOrEnqueue(document.storageKey)),
    );

    await auth.api.removeUser({
      body: { userId: parsedId.data },
      headers: await headers(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error, "admin.user.delete", context);
  }
}
