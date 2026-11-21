import { NextResponse } from "next/server";
import { rateLimitedResponse } from "@/lib/api-response";
import { templateNotebookSchema } from "@/lib/chats/schemas";
import { templateSources } from "@/lib/chats/template-sources";
import { findChatTemplate } from "@/lib/chats/templates";
import { logError } from "@/lib/log";
import { SeedStorageUnavailable, seedNotebook } from "@/lib/notebooks/seed";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "notebooks:template"),
    limit: 5,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  const body = await request.json().catch(() => null);
  const parsed = templateNotebookSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const template = findChatTemplate(parsed.data.template);
  const sources = templateSources(parsed.data.template);

  if (!template || !sources) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  try {
    const seeded = await seedNotebook({
      userId: session.user.id,
      title: template.title,
      scope: "notebooks.template",
      directory: `templates/${template.id}`,
      sources,
    });

    return NextResponse.json({
      chatId: seeded.chatId,
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

    logError("notebooks.template", error, {
      userId: session.user.id,
      template: template.id,
    });

    return NextResponse.json(
      { error: "The template notebook could not be created." },
      { status: 500 },
    );
  }
}
