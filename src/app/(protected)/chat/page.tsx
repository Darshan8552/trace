import { Suspense } from "react";
import { ChatLibrary } from "@/components/chat/chat-library";
import { ChatLibraryFallback } from "@/components/chat/chat-page-fallback";
import { AppHeader } from "@/components/shell/app-header";
import { isAdminUser } from "@/lib/admin/access";
import { listChatSummaries } from "@/lib/chats/queries";
import { requireSession } from "@/lib/session";

async function ChatLibraryContent() {
  const { user } = await requireSession();
  const chats = await listChatSummaries(user.id);

  return (
    <>
      <AppHeader user={user} isAdmin={isAdminUser(user)} />
      <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <ChatLibrary chats={chats} />
      </main>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLibraryFallback />}>
      <ChatLibraryContent />
    </Suspense>
  );
}
