import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChatPageFallback } from "@/components/chat/chat-page-fallback";
import { ChatPanel } from "@/components/chat/chat-panel";
import { AppHeader } from "@/components/shell/app-header";
import { isAdminUser } from "@/lib/admin/access";
import { listFeedbackForChat } from "@/lib/chats/queries";
import { chatIdSchema } from "@/lib/chats/schemas";
import { toChatUIMessage } from "@/lib/chats/serialize";
import { serverEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

async function ChatContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    setup?: string;
    message?: string;
    template?: string;
  }>;
}) {
  const { user } = await requireSession();
  const parsedId = chatIdSchema.safeParse((await params).id);
  const { setup, message: focusMessageId, template } = await searchParams;
  const openSetup = setup === "1";

  if (!parsedId.success) {
    notFound();
  }

  const [chat, initialFeedback] = await Promise.all([
    prisma.chat.findFirst({
      where: { id: parsedId.data, userId: user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    }),
    listFeedbackForChat(user.id, parsedId.data),
  ]);

  if (!chat) {
    notFound();
  }

  return (
    <>
      <AppHeader
        user={user}
        variant="compact"
        className="lg:hidden"
        isAdmin={isAdminUser(user)}
      />
      <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <ChatPanel
          key={chat.id}
          userId={user.id}
          chatId={chat.id}
          chatTitle={chat.title}
          viewerName={user.name}
          initialMessages={chat.messages.map(toChatUIMessage)}
          initialFeedback={initialFeedback}
          initialShareSlug={chat.shareSlug}
          focusMessageId={
            typeof focusMessageId === "string" ? focusMessageId : undefined
          }
          openSetup={openSetup}
          templateId={template}
          spreadsheetsEnabled={serverEnv().INGEST_SPREADSHEETS}
        />
      </main>
    </>
  );
}

export default function ChatDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    setup?: string;
    message?: string;
    template?: string;
  }>;
}) {
  return (
    <Suspense fallback={<ChatPageFallback />}>
      <ChatContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
