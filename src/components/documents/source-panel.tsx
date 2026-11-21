"use client";

import { PlusIcon } from "lucide-react";
import { TraceLogo } from "@/components/brand/trace-logo";
import { DocumentList } from "@/components/documents/document-list";
import { AccountMenu } from "@/components/shell/account-menu";
import { Button } from "@/components/ui/button";
import type { DocumentSummary } from "@/lib/documents/types";
import { MAX_DOCUMENTS_PER_CHAT } from "@/lib/documents/upload";

export function SourcePanel({
  documents,
  isLoading,
  error,
  viewerName,
  onAddSource,
  onDelete,
  onRetry,
  onRefresh,
  onReindex,
  onReindexAll,
  indexingStalled,
  onCheckAgain,
}: {
  documents: DocumentSummary[];
  isLoading: boolean;
  error: string | null;
  viewerName: string;
  onAddSource: () => void;
  onDelete: (id: string) => Promise<void>;
  onRetry?: (id: string) => Promise<void>;
  onRefresh?: (id: string) => Promise<boolean>;
  onReindex?: (id: string) => Promise<void>;
  onReindexAll?: () => Promise<void>;
  indexingStalled?: boolean;
  onCheckAgain?: () => Promise<void>;
}) {
  const isFull = documents.length >= MAX_DOCUMENTS_PER_CHAT;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center border-b border-border pb-3">
        <TraceLogo
          href="/chat"
          markClassName="size-5"
          className="text-[1.15rem] hover:text-highlight"
        />
      </div>

      <div className="mt-3 flex items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="font-mono text-[0.62rem] text-muted-foreground">
            Source manifest
          </p>
          <h2 className="mt-1 font-display text-xl leading-none tracking-[-0.01em]">
            Sources
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <p className="font-mono text-[0.62rem] text-muted-foreground">
            {documents.length} / {MAX_DOCUMENTS_PER_CHAT}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Add source"
            title={
              isFull
                ? `This chat holds ${MAX_DOCUMENTS_PER_CHAT} sources`
                : "Add source"
            }
            disabled={isFull}
            onClick={onAddSource}
          >
            <PlusIcon aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="scrollbar-hidden mt-4 min-h-0 flex-1 overflow-y-auto">
        {isLoading && documents.length === 0 ? (
          <div className="h-16 animate-pulse rounded-[3px] border border-border bg-surface/50" />
        ) : null}

        {documents.length > 0 ? (
          <DocumentList
            documents={documents}
            onDelete={onDelete}
            onRetry={onRetry}
            onRefresh={onRefresh}
            onReindex={onReindex}
            onReindexAll={onReindexAll}
            indexingStalled={indexingStalled}
            onCheckAgain={onCheckAgain}
          />
        ) : null}

        {!isLoading && documents.length === 0 ? (
          <button
            type="button"
            onClick={onAddSource}
            className="flex w-full flex-col items-center gap-2 rounded-[3px] border border-dashed border-muted-foreground/40 bg-surface/40 px-4 py-8 text-center transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <span className="flex size-8 items-center justify-center border border-border bg-surface text-muted-foreground">
              <PlusIcon aria-hidden="true" className="size-4" />
            </span>
            <span className="text-sm font-medium">Add your first source</span>
            <span className="font-mono text-[0.62rem] leading-5 text-muted-foreground">
              PDF / DOCX / TXT / MD
            </span>
          </button>
        ) : null}

        {isFull ? (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            This chat holds {MAX_DOCUMENTS_PER_CHAT} sources. Remove one to add
            another.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-xs leading-5 text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <AccountMenu name={viewerName} side="top" align="start" />
      </div>
    </div>
  );
}
