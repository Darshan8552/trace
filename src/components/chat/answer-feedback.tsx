"use client";

import { cn } from "cn";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { useState } from "react";
import {
  FEEDBACK_REASON_LABELS,
  FEEDBACK_REASONS,
  type FeedbackRating,
  type FeedbackReason,
  type FeedbackSummary,
} from "@/lib/feedback/types";

export function AnswerFeedback({
  value,
  onRate,
  onClear,
}: {
  value: FeedbackSummary | null;
  onRate: (
    rating: FeedbackRating,
    reason?: FeedbackReason | null,
    note?: string | null,
  ) => Promise<void>;
  onClear: () => Promise<void>;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(
    rating: FeedbackRating,
    reason: FeedbackReason | null = null,
    noteValue: string | null = null,
    keepDetails = false,
  ) {
    setPending(true);
    setError(null);

    try {
      await onRate(rating, reason, noteValue);
      setNote("");

      if (!keepDetails) {
        setShowDetails(false);
      }
    } catch {
      setError("Your feedback could not be saved.");
    } finally {
      setPending(false);
    }
  }

  async function clear() {
    setPending(true);
    setError(null);

    try {
      await onClear();
      setShowDetails(false);
      setNote("");
    } catch {
      setError("Your feedback could not be cleared.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        aria-label="Good answer"
        aria-pressed={value?.rating === "up"}
        title="Good answer"
        onClick={() => void submit("up")}
        className={cn(
          "flex items-center gap-1 rounded-[2px] px-1.5 py-1 font-mono text-[0.64rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-50",
          value?.rating === "up" && "bg-highlight/15 text-highlight",
        )}
      >
        <ThumbsUpIcon aria-hidden="true" className="size-3" />
        Good
      </button>

      <button
        type="button"
        disabled={pending}
        aria-label="Bad answer"
        aria-pressed={value?.rating === "down"}
        title="Bad answer"
        onClick={() => {
          if (value?.rating === "down") {
            setShowDetails((current) => !current);
            return;
          }

          setShowDetails(true);
          void submit("down", null, null, true);
        }}
        className={cn(
          "flex items-center gap-1 rounded-[2px] px-1.5 py-1 font-mono text-[0.64rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-50",
          value?.rating === "down" && "bg-highlight/15 text-highlight",
        )}
      >
        <ThumbsDownIcon aria-hidden="true" className="size-3" />
        Bad
      </button>

      {value ? (
        <span className="font-mono text-[0.6rem] text-muted-foreground">
          {showDetails ? "What went wrong?" : "Feedback saved"}
        </span>
      ) : null}

      {value ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => void clear()}
          className="rounded-[2px] px-1 font-mono text-[0.6rem] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          Clear
        </button>
      ) : null}

      {showDetails ? (
        <div className="mt-1 w-full border border-border bg-surface/60 p-2">
          <div className="flex flex-wrap gap-1">
            {FEEDBACK_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                disabled={pending}
                onClick={() => void submit("down", reason)}
                className={cn(
                  "border border-border px-1.5 py-1 font-mono text-[0.6rem] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-50",
                  value?.reason === reason &&
                    "border-highlight/60 text-highlight",
                )}
              >
                {FEEDBACK_REASON_LABELS[reason]}
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <input
              value={note}
              maxLength={500}
              placeholder="Optional note"
              aria-label="Feedback note"
              disabled={pending}
              onChange={(event) => setNote(event.target.value)}
              className="min-w-0 flex-1 border border-border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <button
              type="button"
              disabled={pending || !note.trim()}
              onClick={() =>
                void submit("down", value?.reason ?? null, note.trim())
              }
              className="border border-border px-2 py-1 font-mono text-[0.6rem] transition-colors hover:bg-muted disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
