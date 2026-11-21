"use client";

import { cn } from "cn";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import { stripInvalidCitations } from "@/lib/chat/citations";
import { type ChatSource, sourceHref } from "@/lib/chat/types";

const components: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => (
    <h2 className="mt-6 mb-2 font-display text-xl first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mt-5 mb-2 font-display text-lg first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-4 mb-1.5 font-sans text-sm font-semibold first:mt-0">
      {children}
    </h4>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-[2px] border border-border bg-muted/50 p-3 font-mono text-[0.8em] leading-6 last:mb-0">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded-[2px] bg-muted/70 px-1 py-0.5 font-mono text-[0.82em]">
      {children}
    </code>
  ),
  hr: () => <hr className="my-4 border-border/70" />,
  a: ({ href, children }) => {
    const isSource = href?.startsWith("/api/documents/");
    const opensInNewTab = isSource || !href?.startsWith("/");

    return (
      <a
        href={href}
        target={opensInNewTab ? "_blank" : undefined}
        rel={opensInNewTab ? "noopener noreferrer" : undefined}
        className={cn(
          isSource
            ? "mx-0.5 inline-flex items-center rounded-[1px] bg-highlight px-1 align-baseline font-mono text-[0.62em] font-medium text-highlight-foreground transition-colors hover:bg-highlight/85"
            : "text-foreground underline decoration-highlight decoration-2 underline-offset-4 hover:text-highlight",
        )}
      >
        {children}
      </a>
    );
  },
};

function withCitationLinks(
  text: string,
  sources: ChatSource[],
  chatId?: string,
  hrefForSource?: (source: ChatSource) => string,
): string {
  if (sources.length === 0) {
    return text;
  }

  const byNumber = new Map(sources.map((source) => [source.number, source]));

  return text.replace(/\[(\d+)\]/g, (match, raw: string) => {
    const source = byNumber.get(Number(raw));

    if (!source) {
      return match;
    }

    const href = hrefForSource
      ? hrefForSource(source)
      : sourceHref(source, chatId);

    return `[${raw}](${href})`;
  });
}

export function AnswerMarkdown({
  text,
  sources,
  chatId,
  hrefForSource,
}: {
  text: string;
  sources: ChatSource[];
  chatId?: string;
  hrefForSource?: (source: ChatSource) => string;
}) {
  return (
    <Markdown components={components}>
      {withCitationLinks(
        stripInvalidCitations(text, sources),
        sources,
        chatId,
        hrefForSource,
      )}
    </Markdown>
  );
}
