"use client";

import { cn } from "cn";
import { CheckIcon, CopyIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnswerFeedback } from "@/components/chat/answer-feedback";
import { AnswerMarkdown } from "@/components/chat/answer-markdown";
import { ChatSources } from "@/components/chat/chat-sources";
import { suggestFollowUps } from "@/lib/chat/follow-ups";
import { messageSources, messageText } from "@/lib/chat/message-parts";
import type { ChatUIMessage } from "@/lib/chat/types";
import type { FeedbackSummary } from "@/lib/feedback/types";

function CopyAnswerButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 rounded-[2px] px-1.5 py-1 font-mono text-[0.64rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      {copied ? (
        <CheckIcon aria-hidden="true" className="size-3" />
      ) : (
        <CopyIcon aria-hidden="true" className="size-3" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ChatMessage({
  message,
  isStreaming,
  canRegenerate = false,
  onRegenerate,
  chatId,
  feedback,
  onRate,
  onClearFeedback,
  onSuggestion,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
  chatId?: string;
  feedback?: FeedbackSummary | null;
  onSuggestion?: (text: string) => void;
  onRate?: (
    rating: "up" | "down",
    reason?: FeedbackSummary["reason"],
    note?: string | null,
  ) => Promise<void>;
  onClearFeedback?: () => Promise<void>;
}) {
  const text = messageText(message);
  const sources = messageSources(message);
  const followUps = useMemo(() => suggestFollowUps(sources), [sources]);

  if (!text) {
    return null;
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] border-r-2 border-highlight/70 pr-3 text-right">
          <p className="text-[0.95rem] leading-7 font-medium whitespace-pre-wrap">
            {text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <article
      data-answer-shortcut=""
      tabIndex={-1}
      className="group/answer border-l border-border pl-4 sm:pl-5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-1.5">
        <p className="font-mono text-[0.62rem] text-muted-foreground">
          Trace / answer
        </p>
        <div className="flex items-center gap-1">
          {canRegenerate && onRegenerate ? (
            <button
              type="button"
              onClick={onRegenerate}
              className="flex items-center gap-1.5 rounded-[2px] px-1.5 py-1 font-mono text-[0.64rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <RotateCcwIcon aria-hidden="true" className="size-3" />
              Regenerate
            </button>
          ) : null}
          <CopyAnswerButton text={text} />
        </div>
      </div>
      <div className="mt-3 font-display text-[1.0625rem] leading-8">
        <AnswerMarkdown text={text} sources={sources} chatId={chatId} />
        {isStreaming ? (
          <span
            aria-hidden="true"
            className={cn(
              "ml-0.5 inline-block h-[1.05em] w-[0.4ch] translate-y-[0.15em] animate-pulse bg-highlight",
              "motion-reduce:animate-none",
            )}
          />
        ) : null}
        <ChatSources sources={sources} answerText={text} chatId={chatId} />

        {!isStreaming && onSuggestion && followUps.length > 0 ? (
          <div className="mt-4 border-t border-border/60 pt-2">
            <p className="font-mono text-[0.6rem] tracking-[0.06em] text-muted-foreground uppercase">
              Follow-ups
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {followUps.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSuggestion(suggestion)}
                  className="rounded-[2px] border border-border px-2 py-1 text-left font-mono text-[0.62rem] text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!isStreaming && onRate && onClearFeedback ? (
          <div className="mt-4 border-t border-border/60 pt-2">
            <AnswerFeedback
              value={feedback ?? null}
              onRate={onRate}
              onClear={onClearFeedback}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
