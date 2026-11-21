import type { Metadata } from "next";
import { Suspense } from "react";
import { BlobDeletionQueue } from "@/components/admin/blob-deletion-queue";
import { FailedDocumentList } from "@/components/admin/failed-document-list";
import { FeedbackList } from "@/components/admin/feedback-list";
import { StatGrid } from "@/components/admin/stat-grid";
import { UserList } from "@/components/admin/user-list";
import { AppHeader } from "@/components/shell/app-header";
import { requireAdmin } from "@/lib/admin/guard";
import {
  getAdminStats,
  listFailedDocuments,
  listPendingBlobDeletions,
  listRecentFeedback,
  listUsers,
} from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Operations - Trace",
  robots: { index: false, follow: false },
};

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-2">
        <h2 id={id} className="font-display text-xl leading-none">
          {title}
        </h2>
        <p className="font-mono text-[0.58rem] tracking-[0.06em] text-muted-foreground uppercase">
          {note}
        </p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AdminFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto w-full max-w-6xl animate-pulse px-5 py-10 sm:px-8">
        <div className="h-2.5 w-28 rounded-[2px] bg-secondary/60" />
        <div className="mt-4 h-8 w-56 rounded-[2px] bg-secondary/50" />
        <div className="mt-8 h-24 border border-border bg-secondary/20" />
      </div>
    </div>
  );
}

async function AdminContent() {
  const session = await requireAdmin();
  const [stats, failedDocuments, blobDeletions, feedback, users] =
    await Promise.all([
      getAdminStats(),
      listFailedDocuments(),
      listPendingBlobDeletions(),
      listRecentFeedback(),
      listUsers(),
    ]);

  return (
    <>
      <AppHeader user={session.user} section="admin" isAdmin />
      <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
          <p className="flex items-center gap-2 font-mono text-[0.62rem] text-muted-foreground">
            <span aria-hidden="true" className="h-px w-4 bg-highlight" />
            Workspace / operations
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-4xl leading-none tracking-[-0.02em]">
              Operations
            </h1>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Sources that failed to index, storage deletions waiting to be
              retried, and what readers say about answers.
            </p>
          </div>

          <div className="mt-8">
            <StatGrid stats={stats} />
          </div>

          <Section
            id="users"
            title="Users"
            note={`${stats.users} accounts / latest 50 / roles come from better-auth`}
          >
            <UserList
              users={users}
              currentUserId={session.user.id}
              canManage={session.user.role === "admin"}
            />
          </Section>

          <Section
            id="failed-sources"
            title="Failed sources"
            note={`${stats.documents.FAILED} failed / retry re-embeds from storage`}
          >
            <FailedDocumentList documents={failedDocuments} />
          </Section>

          <Section
            id="blob-deletions"
            title="Storage deletion queue"
            note={`${stats.pendingBlobDeletions} pending`}
          >
            <BlobDeletionQueue entries={blobDeletions} />
          </Section>

          <Section
            id="feedback"
            title="Recent feedback"
            note={`${stats.feedbackDown} down / ${stats.feedbackUp} up / latest 50`}
          >
            <FeedbackList feedback={feedback} />
          </Section>
        </div>
      </main>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminContent />
    </Suspense>
  );
}
