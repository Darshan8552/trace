import type { AdminStats } from "@/lib/admin/types";

export function StatGrid({ stats }: { stats: AdminStats }) {
  const totalDocuments =
    stats.documents.PENDING +
    stats.documents.PROCESSING +
    stats.documents.READY +
    stats.documents.FAILED;

  const items = [
    { label: "Users", value: stats.users, detail: "signed up" },
    { label: "Notebooks", value: stats.notebooks, detail: "total" },
    { label: "Answers", value: stats.messages, detail: "messages stored" },
    {
      label: "Sources",
      value: totalDocuments,
      detail: `${stats.documents.READY} ready / ${stats.documents.FAILED} failed`,
    },
    {
      label: "Feedback",
      value: stats.feedbackUp + stats.feedbackDown,
      detail: `${stats.feedbackUp} up / ${stats.feedbackDown} down`,
    },
    {
      label: "Blob queue",
      value: stats.pendingBlobDeletions,
      detail: "pending deletions",
    },
  ];

  return (
    <dl className="grid grid-cols-2 border-t border-l border-border md:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="border-r border-b border-border px-4 py-3.5"
        >
          <dt className="font-mono text-[0.58rem] tracking-[0.08em] text-muted-foreground uppercase">
            {item.label}
          </dt>
          <dd className="mt-1 font-display text-3xl leading-none tabular-nums">
            {item.value}
          </dd>
          <dd className="mt-1.5 font-mono text-[0.58rem] text-muted-foreground">
            {item.detail}
          </dd>
        </div>
      ))}
    </dl>
  );
}
