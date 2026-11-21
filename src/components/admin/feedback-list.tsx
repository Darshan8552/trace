import { cn } from "cn";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import Link from "next/link";
import type { AdminFeedback } from "@/lib/admin/types";
import { FEEDBACK_REASON_LABELS } from "@/lib/feedback/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function FeedbackList({ feedback }: { feedback: AdminFeedback[] }) {
  if (feedback.length === 0) {
    return (
      <p className="border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
        No feedback yet. Ratings appear here as readers judge answers.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {feedback.map((entry) => {
        const helpful = entry.rating === "up";
        const Icon = helpful ? ThumbsUpIcon : ThumbsDownIcon;

        return (
          <li key={entry.id} className="py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[0.58rem] tracking-[0.06em] uppercase",
                  helpful
                    ? "border-border text-foreground"
                    : "border-destructive/30 text-destructive",
                )}
              >
                <Icon aria-hidden="true" className="size-3" />
                {helpful ? "Helpful" : "Not helpful"}
              </span>
              {entry.reason ? (
                <span className="font-mono text-[0.6rem] text-muted-foreground">
                  {FEEDBACK_REASON_LABELS[entry.reason]}
                </span>
              ) : null}
              <span className="font-mono text-[0.6rem] text-muted-foreground">
                {entry.userEmail}
              </span>
              <span className="font-mono text-[0.6rem] text-muted-foreground">
                {dateFormatter.format(new Date(entry.createdAt))} UTC
              </span>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6">{entry.excerpt}</p>

            {entry.note ? (
              <p className="mt-1 max-w-3xl border-l-2 border-highlight/60 pl-3 text-sm leading-6 text-muted-foreground italic">
                {entry.note}
              </p>
            ) : null}

            <Link
              href={`/chat/${entry.chatId}?message=${entry.messageId}`}
              className="mt-2 inline-block rounded-[2px] font-mono text-[0.6rem] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              {entry.chatTitle}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
