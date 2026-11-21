"use client";

import { cn } from "cn";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { sourceFileHref } from "@/lib/chat/types";

export type SourceViewerDocument = {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  pageCount: number | null;
  status: string;
  error: string | null;
  sourceUrl: string | null;
};

export type SourceViewerChunk = {
  id: string;
  position: number;
  page: number | null;
  content: string;
};

function sourceHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function CopyPassageButton({ text }: { text: string }) {
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
      onClick={() => void copy()}
      className="flex items-center gap-1.5 rounded-[2px] px-1.5 py-1 font-mono text-[0.64rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      {copied ? (
        <CheckIcon aria-hidden="true" className="size-3" />
      ) : (
        <CopyIcon aria-hidden="true" className="size-3" />
      )}
      {copied ? "Copied" : "Copy passage"}
    </button>
  );
}

export function SourceViewer({
  chatId,
  chatTitle,
  sourceDocument,
  chunks,
  activeChunkId,
  backHref,
  showOriginal = true,
}: {
  chatId: string;
  chatTitle: string;
  sourceDocument: SourceViewerDocument;
  chunks: SourceViewerChunk[];
  activeChunkId: string | null;
  backHref?: string;
  showOriginal?: boolean;
}) {
  const activeChunk =
    chunks.find((chunk) => chunk.id === activeChunkId) ?? null;
  const isPdf = sourceDocument.mimeType === "application/pdf";
  const fileHref = sourceFileHref({
    number: 1,
    documentId: sourceDocument.id,
    title: sourceDocument.title,
    page: activeChunk?.page ?? null,
    similarity: 1,
  });

  useEffect(() => {
    if (!activeChunkId) {
      return;
    }

    const target = document.getElementById(`passage-${activeChunkId}`);

    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeChunkId]);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href={backHref ?? `/chat/${chatId}`}
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[2px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            aria-label="Back to chat"
          >
            <span aria-hidden="true" className="font-mono text-sm">
              ←
            </span>
          </Link>

          <div className="min-w-0">
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              Source / {chatTitle}
            </p>
            <h1 className="mt-0.5 truncate font-display text-[1.6rem] leading-tight tracking-[-0.02em]">
              {sourceDocument.title}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.62rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FileTextIcon aria-hidden="true" className="size-3" />
                {sourceDocument.filename}
              </span>
              {sourceDocument.pageCount ? (
                <span>{sourceDocument.pageCount} pages</span>
              ) : null}
              <span>
                {chunks.length} {chunks.length === 1 ? "passage" : "passages"}
              </span>
              {sourceDocument.sourceUrl ? (
                <a
                  href={sourceDocument.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
                >
                  <ExternalLinkIcon aria-hidden="true" className="size-3" />
                  {sourceHostname(sourceDocument.sourceUrl)}
                </a>
              ) : null}
            </p>
          </div>
        </div>

        {showOriginal ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="gap-1.5"
            render={
              <a href={fileHref} target="_blank" rel="noreferrer">
                <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
                {isPdf ? "Open PDF" : "Open original"}
              </a>
            }
          />
        ) : null}
      </div>

      {activeChunk ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-highlight/40 bg-highlight/10 px-3 py-2">
          <p className="font-mono text-[0.62rem] text-muted-foreground">
            Cited passage{activeChunk.page ? ` · page ${activeChunk.page}` : ""}
          </p>
          <CopyPassageButton text={activeChunk.content} />
        </div>
      ) : null}

      {chunks.length === 0 ? (
        <div className="mt-10 border border-dashed border-border px-5 py-10 text-center">
          <p className="font-display text-xl">No passages are available yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {sourceDocument.status === "FAILED"
              ? (sourceDocument.error ??
                "This source could not be indexed, so there is nothing to read here.")
              : "This source is still being indexed. Try again in a moment."}
          </p>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="mt-4"
            render={<Link href={backHref ?? `/chat/${chatId}`} />}
          >
            Back to chat
          </Button>
        </div>
      ) : (
        <ol className="mt-6 flex flex-col gap-1">
          {chunks.map((chunk) => {
            const isActive = chunk.id === activeChunkId;

            return (
              <li
                key={chunk.id}
                id={`passage-${chunk.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "scroll-mt-24 border-l-2 py-4 pl-4 transition-colors",
                  isActive
                    ? "border-highlight bg-highlight/10"
                    : "border-transparent",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[0.62rem] text-muted-foreground">
                    Passage {chunk.position + 1}
                    {chunk.page ? ` · page ${chunk.page}` : ""}
                  </p>
                  {isActive ? (
                    <span className="bg-highlight px-1.5 py-0.5 font-mono text-[0.56rem] tracking-[0.06em] text-highlight-foreground uppercase">
                      Cited
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 font-display text-[1.02rem] leading-8 whitespace-pre-wrap">
                  {chunk.content}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
