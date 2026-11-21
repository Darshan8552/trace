"use client";

import { AnswerMarkdown } from "@/components/chat/answer-markdown";
import { messageSources, messageText } from "@/lib/chat/message-parts";
import type { ChatUIMessage } from "@/lib/chat/types";

function publicSourceHref(
  slug: string,
  source: { documentId: string; chunkId?: string },
): string {
  const base = `/s/${slug}/source/${source.documentId}`;

  return source.chunkId
    ? `${base}?chunk=${encodeURIComponent(source.chunkId)}`
    : base;
}

export function SharedNotebook({
  slug,
  messages,
}: {
  slug: string;
  messages: ChatUIMessage[];
}) {
  return (
    <div className="flex flex-col gap-9">
      {messages.map((message) => {
        const text = messageText(message);

        if (!text) {
          return null;
        }

        if (message.role === "user") {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] border-r-2 border-highlight/70 pr-3 text-right">
                <p className="text-[0.95rem] leading-7 font-medium whitespace-pre-wrap">
                  {text}
                </p>
              </div>
            </div>
          );
        }

        const sources = messageSources(message);

        return (
          <article
            key={message.id}
            className="border-l border-border pl-4 sm:pl-5"
          >
            <p className="border-b border-border/60 pb-1.5 font-mono text-[0.62rem] text-muted-foreground">
              Trace / answer
            </p>
            <div className="mt-3 font-display text-[1.0625rem] leading-8">
              <AnswerMarkdown
                text={text}
                sources={sources}
                hrefForSource={(source) => publicSourceHref(slug, source)}
              />
            </div>

            {sources.length > 0 ? (
              <div className="mt-5 border-t border-border pt-3">
                <p className="font-mono text-[0.64rem] text-muted-foreground">
                  Cited passages
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {sources.map((source) => (
                    <li key={`${source.documentId}-${source.number}`}>
                      <a
                        href={publicSourceHref(slug, source)}
                        className="flex items-start gap-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center bg-highlight font-mono text-[0.62rem] text-highlight-foreground">
                          {source.number}
                        </span>
                        <span>
                          {source.title}
                          {source.page ? ` · p. ${source.page}` : ""}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
