"use client";

import { cn } from "cn";
import {
  AlertTriangleIcon,
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { friendlyDocumentError } from "@/lib/documents/failures";
import {
  DOCUMENT_STATUS_LABELS,
  type DocumentSummary,
  isIndexingStatus,
  isStaleDocument,
} from "@/lib/documents/types";
import { formatFileSize } from "@/lib/documents/upload";

function StatusPill({ document }: { document: DocumentSummary }) {
  const isBusy = isIndexingStatus(document.status);
  const isStale = isStaleDocument(document);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center border px-1.5 py-0.5 font-mono text-[0.62rem] tracking-[0.06em] uppercase",
        document.status === "READY" &&
          document.searchable &&
          "border-foreground/25 text-foreground",
        isStale && "border-highlight/50 text-highlight",
        isBusy && "border-border text-muted-foreground",
        document.status === "FAILED" &&
          "border-destructive/40 text-destructive",
      )}
    >
      {isStale ? "Needs reindex" : DOCUMENT_STATUS_LABELS[document.status]}
    </span>
  );
}

const checkedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function sourceHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function documentTypeLabel(filename: string): string {
  const extension = filename.split(".").pop()?.toUpperCase() ?? "";

  if (extension === "MARKDOWN") {
    return "MD";
  }

  return extension || "FILE";
}

function documentMeta(document: DocumentSummary): string {
  const parts = [formatFileSize(document.sizeBytes)];

  if (document.pageCount) {
    parts.push(
      `${document.pageCount} ${document.pageCount === 1 ? "page" : "pages"}`,
    );
  }

  if (document.sourceCheckedAt) {
    const checked = new Date(document.sourceCheckedAt);

    if (!Number.isNaN(checked.getTime())) {
      parts.push(`checked ${checkedAtFormatter.format(checked)}`);
    }
  }

  return parts.join(" · ");
}

export function DocumentList({
  documents,
  onDelete,
  onRetry,
  onRefresh,
  onReindex,
  onReindexAll,
  indexingStalled = false,
  onCheckAgain,
}: {
  documents: DocumentSummary[];
  onDelete: (id: string) => Promise<void>;
  onRetry?: (id: string) => Promise<void>;
  onRefresh?: (id: string) => Promise<boolean>;
  onReindex?: (id: string) => Promise<void>;
  onReindexAll?: () => Promise<void>;
  indexingStalled?: boolean;
  onCheckAgain?: () => Promise<void>;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [reindexingAll, setReindexingAll] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staleDocuments = documents.filter(isStaleDocument);
  const indexingDocuments = documents.filter((document) =>
    isIndexingStatus(document.status),
  );

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);

    try {
      await onDelete(id);
      setConfirmingId(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "That source could not be removed.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRetry(id: string) {
    if (!onRetry) {
      return;
    }

    setError(null);
    setRetryingId(id);

    try {
      await onRetry(id);
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : "This source could not be indexed.",
      );
    } finally {
      setRetryingId(null);
    }
  }

  async function handleRefresh(id: string) {
    if (!onRefresh) {
      return;
    }

    setError(null);
    setRefreshingId(id);

    try {
      await onRefresh(id);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "This page could not be refreshed.",
      );
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleReindex(id: string) {
    if (!onReindex) {
      return;
    }

    setError(null);
    setReindexingId(id);

    try {
      await onReindex(id);
    } catch (reindexError) {
      setError(
        reindexError instanceof Error
          ? reindexError.message
          : "This source could not be reindexed.",
      );
    } finally {
      setReindexingId(null);
    }
  }

  async function handleReindexAll() {
    if (!onReindexAll) {
      return;
    }

    setError(null);
    setReindexingAll(true);

    try {
      await onReindexAll();
    } catch (reindexError) {
      setError(
        reindexError instanceof Error
          ? reindexError.message
          : "Some sources could not be reindexed.",
      );
    } finally {
      setReindexingAll(false);
    }
  }

  async function handleCheckAgain() {
    if (!onCheckAgain) {
      return;
    }

    setError(null);
    setChecking(true);

    try {
      await onCheckAgain();
    } catch {
      setError("Your sources could not be refreshed.");
    } finally {
      setChecking(false);
    }
  }

  async function handleRetryAll() {
    if (!onRetry) {
      return;
    }

    setError(null);

    try {
      for (const document of indexingDocuments) {
        await onRetry(document.id);
      }
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : "This source could not be indexed.",
      );
    }
  }

  return (
    <div className="space-y-2">
      {staleDocuments.length > 0 ? (
        <div className="flex items-start gap-2 border border-highlight/40 bg-highlight/5 px-3 py-2.5">
          <AlertTriangleIcon
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-highlight"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-5">
              {staleDocuments.length === 1
                ? "One source was indexed with a different embedding model and can't be searched."
                : `${staleDocuments.length} sources were indexed with a different embedding model and can't be searched.`}
            </p>
            {onReindexAll ? (
              <Button
                type="button"
                size="xs"
                variant="outline"
                className="mt-2"
                disabled={reindexingAll}
                onClick={() => void handleReindexAll()}
              >
                {reindexingAll ? (
                  <Loader2Icon
                    aria-hidden="true"
                    className="size-3.5 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <RotateCcwIcon aria-hidden="true" className="size-3.5" />
                )}
                Reindex {staleDocuments.length === 1 ? "source" : "sources"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {indexingStalled && indexingDocuments.length > 0 ? (
        <div className="flex items-start gap-2 border border-border bg-surface/60 px-3 py-2.5">
          <AlertTriangleIcon
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-5">
              Indexing is taking longer than expected. You can keep working
              while it finishes.
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {onCheckAgain ? (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={checking}
                  onClick={() => void handleCheckAgain()}
                >
                  {checking ? (
                    <Loader2Icon
                      aria-hidden="true"
                      className="size-3.5 animate-spin motion-reduce:animate-none"
                    />
                  ) : null}
                  Check again
                </Button>
              ) : null}
              {onRetry ? (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => void handleRetryAll()}
                >
                  Retry indexing
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ul className="divide-y divide-border/70 overflow-hidden rounded-[3px] border border-border bg-surface/50">
        {documents.map((document, index) => {
          const isConfirming = confirmingId === document.id;
          const isDeleting = deletingId === document.id;
          const isRetrying = retryingId === document.id;
          const isRefreshing = refreshingId === document.id;
          const isReindexing = reindexingId === document.id;
          const isStale = isStaleDocument(document);

          return (
            <li key={document.id} className="px-3 py-3">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="w-5 shrink-0 pt-0.5 font-mono text-[0.62rem] text-highlight"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <a
                    href={`/api/documents/${document.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="block max-w-full text-sm leading-5 font-medium break-words underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                  >
                    {document.title}
                  </a>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <StatusPill document={document} />
                    <span className="border border-border px-1.5 py-0.5 font-mono text-[0.58rem] tracking-[0.06em] text-muted-foreground uppercase">
                      {documentTypeLabel(document.filename)}
                    </span>
                    {document.sourceUrl ? (
                      <a
                        href={document.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open original web page for ${document.title}`}
                        className="inline-flex items-center gap-1 font-mono text-[0.62rem] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                      >
                        <ExternalLinkIcon
                          aria-hidden="true"
                          className="size-3"
                        />
                        {sourceHostname(document.sourceUrl)}
                      </a>
                    ) : null}
                    <p
                      className={cn(
                        "line-clamp-2 min-w-0 font-mono text-[0.62rem] leading-4",
                        document.status === "FAILED"
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {document.status === "FAILED" && document.error
                        ? (friendlyDocumentError(document) ?? document.error)
                        : documentMeta(document)}
                    </p>
                  </div>
                </div>

                {isConfirming ? null : (
                  <div className="flex shrink-0 items-center">
                    {isStale && onReindex ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Reindex ${document.title}`}
                        title="Reindex with the current model"
                        disabled={isReindexing || reindexingAll}
                        className="size-8 text-muted-foreground"
                        onClick={() => void handleReindex(document.id)}
                      >
                        {isReindexing ? (
                          <Loader2Icon
                            aria-hidden="true"
                            className="size-3.5 animate-spin motion-reduce:animate-none"
                          />
                        ) : (
                          <RotateCcwIcon
                            aria-hidden="true"
                            className="size-3.5"
                          />
                        )}
                      </Button>
                    ) : null}

                    {document.sourceUrl && onRefresh ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Refresh ${document.title}`}
                        title="Fetch this page again"
                        disabled={isRefreshing}
                        className="size-8 text-muted-foreground"
                        onClick={() => void handleRefresh(document.id)}
                      >
                        {isRefreshing ? (
                          <Loader2Icon
                            aria-hidden="true"
                            className="size-3.5 animate-spin motion-reduce:animate-none"
                          />
                        ) : (
                          <RefreshCwIcon
                            aria-hidden="true"
                            className="size-3.5"
                          />
                        )}
                      </Button>
                    ) : null}

                    {document.status === "FAILED" && onRetry ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Retry indexing ${document.title}`}
                        title="Retry indexing"
                        disabled={isRetrying}
                        className="size-8 text-muted-foreground"
                        onClick={() => void handleRetry(document.id)}
                      >
                        {isRetrying ? (
                          <Loader2Icon
                            aria-hidden="true"
                            className="size-3.5 animate-spin motion-reduce:animate-none"
                          />
                        ) : (
                          <RotateCcwIcon
                            aria-hidden="true"
                            className="size-3.5"
                          />
                        )}
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${document.title}`}
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setError(null);
                        setConfirmingId(document.id);
                      }}
                    >
                      <Trash2Icon aria-hidden="true" className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {isConfirming ? (
                <div className="mt-2 flex justify-end gap-1">
                  <Button
                    type="button"
                    size="xs"
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={() => void handleDelete(document.id)}
                  >
                    {isDeleting ? "Removing…" : "Remove"}
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    disabled={isDeleting}
                    onClick={() => setConfirmingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p role="alert" className="text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
