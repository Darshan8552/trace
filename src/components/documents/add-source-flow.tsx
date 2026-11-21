"use client";

import { cn } from "cn";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  Link2Icon,
  PenLineIcon,
  UploadCloudIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentDropzone } from "@/components/documents/document-dropzone";
import { DocumentList } from "@/components/documents/document-list";
import { TextSourceForm } from "@/components/documents/text-source-form";
import { UrlSourceForm } from "@/components/documents/url-source-form";
import type { DocumentSummary } from "@/lib/documents/types";
import { MAX_DOCUMENTS_PER_CHAT, uploadPolicy } from "@/lib/documents/upload";

type SourceMethod = "upload" | "paste" | "url";

export type SourceView = "picker" | SourceMethod;

const METHODS: {
  id: SourceMethod;
  label: string;
  description: string;
  icon: typeof UploadCloudIcon;
}[] = [
  {
    id: "upload",
    label: "Upload from device",
    description: "Your files, up to 20 MB each.",
    icon: UploadCloudIcon,
  },
  {
    id: "paste",
    label: "Paste or write",
    description: "Add notes, an article, or any text as a source.",
    icon: PenLineIcon,
  },
  {
    id: "url",
    label: "Website link",
    description: "Add the readable text of a public web page.",
    icon: Link2Icon,
  },
];

export function AddSourceFlow({
  userId,
  chatId,
  documents,
  isLoading,
  error,
  onAdded,
  onDelete,
  onRetry,
  onRefresh,
  onReindex,
  onReindexAll,
  indexingStalled,
  onCheckAgain,
  showExisting = false,
  spreadsheetsEnabled = false,
  onComplete,
  onViewChange,
}: {
  userId: string;
  chatId: string;
  documents: DocumentSummary[];
  isLoading: boolean;
  error: string | null;
  onAdded: (document: DocumentSummary) => void;
  onDelete: (id: string) => Promise<void>;
  onRetry?: (id: string) => Promise<void>;
  onRefresh?: (id: string) => Promise<boolean>;
  onReindex?: (id: string) => Promise<void>;
  onReindexAll?: () => Promise<void>;
  indexingStalled?: boolean;
  onCheckAgain?: () => Promise<void>;
  showExisting?: boolean;
  spreadsheetsEnabled?: boolean;
  onComplete?: () => void;
  onViewChange?: (view: SourceView) => void;
}) {
  const [method, setMethod] = useState<SourceMethod | null>(null);
  const isFull = documents.length >= MAX_DOCUMENTS_PER_CHAT;
  const activeMethod = METHODS.find((entry) => entry.id === method) ?? null;
  const uploadDescription = `${uploadPolicy(spreadsheetsEnabled).label} — up to 20 MB each.`;
  const activeDescription =
    activeMethod?.id === "upload"
      ? uploadDescription
      : (activeMethod?.description ?? "");

  useEffect(() => {
    onViewChange?.(method ?? "picker");
  }, [method, onViewChange]);

  function finish() {
    if (onComplete) {
      onComplete();
      return;
    }

    setMethod(null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {showExisting &&
      activeMethod === null &&
      (isLoading || documents.length > 0) ? (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              In this chat
            </p>
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              {documents.length} / {MAX_DOCUMENTS_PER_CHAT}
            </p>
          </div>

          {isLoading && documents.length === 0 ? (
            <div className="h-14 animate-pulse rounded-[3px] border border-border bg-surface/50" />
          ) : (
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
          )}
        </section>
      ) : null}

      {activeMethod === null ? (
        <section className="flex flex-col gap-2.5">
          <p className="font-mono text-[0.62rem] text-muted-foreground">
            {showExisting && documents.length > 0
              ? "Add another"
              : "Choose a method"}
          </p>

          <ul className="divide-y divide-border overflow-hidden rounded-[3px] border border-border">
            {METHODS.map((entry) => {
              const Icon = entry.icon;

              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    disabled={isFull}
                    onClick={() => setMethod(entry.id)}
                    className={cn(
                      "group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none enabled:hover:bg-muted/60",
                      isFull && "opacity-50",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center border border-border bg-surface text-muted-foreground">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {entry.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {entry.id === "upload"
                          ? uploadDescription
                          : entry.description}
                      </span>
                    </span>

                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {isFull ? (
            <p className="text-xs leading-5 text-muted-foreground">
              This chat holds {MAX_DOCUMENTS_PER_CHAT} sources. Remove one to
              add another.
            </p>
          ) : null}
        </section>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col gap-4">
          <button
            type="button"
            onClick={() => setMethod(null)}
            className="flex w-fit items-center gap-1.5 rounded-[2px] font-mono text-[0.62rem] tracking-[0.06em] text-muted-foreground uppercase transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
            All methods
          </button>

          <div>
            <h3 className="font-display text-xl leading-tight tracking-[-0.01em]">
              {activeMethod.label}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {activeDescription}
            </p>
          </div>

          {method === "upload" ? (
            <DocumentDropzone
              userId={userId}
              chatId={chatId}
              currentCount={documents.length}
              spreadsheetsEnabled={spreadsheetsEnabled}
              onUploaded={onAdded}
              onBatchComplete={(addedCount) => {
                if (addedCount > 0) {
                  finish();
                }
              }}
            />
          ) : null}

          {method === "paste" ? (
            <TextSourceForm
              userId={userId}
              chatId={chatId}
              disabled={isFull}
              onAdded={(document) => {
                onAdded(document);
                finish();
              }}
            />
          ) : null}

          {method === "url" ? (
            <UrlSourceForm
              chatId={chatId}
              disabled={isFull}
              onAdded={(document) => {
                onAdded(document);
                finish();
              }}
            />
          ) : null}
        </section>
      )}

      {error ? (
        <p role="alert" className="text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
