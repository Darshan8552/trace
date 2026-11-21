"use client";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  FileTextIcon,
} from "lucide-react";
import { useState } from "react";
import { citedNumbers } from "@/lib/chat/citations";
import { CONFIDENCE_LABELS, sourceConfidence } from "@/lib/chat/confidence";
import { type ChatSource, sourceFileHref, sourceHref } from "@/lib/chat/types";

const COLLAPSED_SOURCE_LIMIT = 3;

function SourceList({
  sources,
  chatId,
  dimmed = false,
}: {
  sources: ChatSource[];
  chatId?: string;
  dimmed?: boolean;
}) {
  return (
    <ul className="mt-2 flex flex-col">
      {sources.map((source) => (
        <li
          key={`${source.documentId}-${source.number}`}
          className="group flex items-start gap-1 rounded-[2px] hover:bg-muted/60"
        >
          <a
            href={sourceHref(source, chatId)}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-1 items-start gap-2.5 rounded-[2px] px-1 py-1 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <span
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center bg-highlight font-mono text-[0.62rem] text-highlight-foreground ${
                dimmed ? "opacity-60" : ""
              }`}
            >
              {source.number}
            </span>

            <span className="flex min-w-0 flex-1 items-center gap-2">
              <FileTextIcon
                aria-hidden="true"
                className="size-3.5 shrink-0 opacity-50"
              />
              <span className="truncate font-medium">{source.title}</span>
              {source.page ? (
                <span className="shrink-0 font-mono text-[0.64rem]">
                  p. {source.page}
                </span>
              ) : null}
              <span className="shrink-0 font-mono text-[0.56rem] text-foreground">
                {CONFIDENCE_LABELS[sourceConfidence(source.similarity)]}
              </span>
            </span>
          </a>

          <a
            href={sourceFileHref(source)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open original file for ${source.title}`}
            title="Open original file"
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[2px] text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <ExternalLinkIcon aria-hidden="true" className="size-3" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ChatSources({
  sources,
  answerText,
  chatId,
}: {
  sources: ChatSource[];
  answerText: string;
  chatId?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (sources.length === 0) {
    return null;
  }

  const cited = citedNumbers(answerText);
  const used = sources.filter((source) => cited.has(source.number));
  const unused = sources.filter((source) => !cited.has(source.number));
  const primary = used.length > 0 ? used : sources;
  const secondary = used.length > 0 ? unused : [];
  const preview = (used.length > 0 ? [...used, ...unused] : sources).slice(
    0,
    COLLAPSED_SOURCE_LIMIT,
  );
  const isCollapsible = sources.length > COLLAPSED_SOURCE_LIMIT;
  const documentCount = new Set(sources.map((source) => source.documentId))
    .size;
  const passageLabel =
    sources.length === 1 ? "1 passage" : `${sources.length} passages`;
  const documentLabel =
    documentCount === 1 ? "1 source" : `${documentCount} sources`;

  return (
    <div className="mt-5 border-t border-border pt-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[0.64rem] text-muted-foreground">
            Source passages
          </p>
          <p className="mt-0.5 font-mono text-[0.56rem] text-muted-foreground">
            {passageLabel} from {documentLabel}
          </p>
        </div>
      </div>

      {expanded ? (
        <>
          <SourceList sources={primary} chatId={chatId} />

          {secondary.length > 0 ? (
            <div className="mt-3">
              <p className="px-1 font-mono text-[0.56rem] tracking-[0.06em] text-muted-foreground uppercase">
                Also available
              </p>
              <SourceList sources={secondary} chatId={chatId} dimmed />
            </div>
          ) : null}
        </>
      ) : (
        <SourceList sources={preview} chatId={chatId} />
      )}

      {isCollapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-2 flex items-center gap-1.5 rounded-[2px] px-1 py-1 font-mono text-[0.64rem] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {expanded ? (
            <ChevronUpIcon aria-hidden="true" className="size-3.5" />
          ) : (
            <ChevronDownIcon aria-hidden="true" className="size-3.5" />
          )}
          {expanded ? "Show fewer" : `View all ${passageLabel}`}
        </button>
      ) : null}
    </div>
  );
}
