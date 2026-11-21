"use client";

import { cn } from "cn";
import { useState } from "react";
import {
  AddSourceFlow,
  type SourceView,
} from "@/components/documents/add-source-flow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DocumentSummary } from "@/lib/documents/types";
import { MAX_DOCUMENTS_PER_CHAT } from "@/lib/documents/upload";

export function SourceSetupDialog({
  open,
  onOpenChange,
  userId,
  chatId,
  documents,
  isLoading,
  error,
  onUploaded,
  onDelete,
  onRetry,
  onRefresh,
  onReindex,
  onReindexAll,
  indexingStalled,
  onCheckAgain,
  spreadsheetsEnabled = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  chatId: string;
  documents: DocumentSummary[];
  isLoading: boolean;
  error: string | null;
  onUploaded: (document: DocumentSummary) => void;
  onDelete: (id: string) => Promise<void>;
  onRetry?: (id: string) => Promise<void>;
  onRefresh?: (id: string) => Promise<boolean>;
  onReindex?: (id: string) => Promise<void>;
  onReindexAll?: () => Promise<void>;
  indexingStalled?: boolean;
  onCheckAgain?: () => Promise<void>;
  spreadsheetsEnabled?: boolean;
}) {
  const [view, setView] = useState<SourceView>("picker");

  function handleOpenChange(next: boolean) {
    if (!next) {
      setView("picker");
    }

    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[88dvh] flex-col gap-0 overflow-hidden rounded-[4px] p-0",
          view === "paste" ? "h-[88dvh] sm:max-w-3xl" : "sm:max-w-2xl",
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-highlight"
        />

        <DialogHeader className="border-b border-border px-5 pt-5 pr-12 pb-4">
          <p className="font-mono text-[0.62rem] text-muted-foreground">
            Source manifest / new notebook
          </p>
          <DialogTitle className="font-display text-2xl leading-tight tracking-[-0.02em]">
            Add sources to this chat
          </DialogTitle>
          <DialogDescription className="max-w-lg text-sm leading-6">
            Upload a file or paste text. You can start chatting at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5">
          <AddSourceFlow
            userId={userId}
            chatId={chatId}
            documents={documents}
            isLoading={isLoading}
            error={error}
            onAdded={onUploaded}
            onDelete={onDelete}
            onRetry={onRetry}
            onRefresh={onRefresh}
            onReindex={onReindex}
            onReindexAll={onReindexAll}
            indexingStalled={indexingStalled}
            onCheckAgain={onCheckAgain}
            spreadsheetsEnabled={spreadsheetsEnabled}
            showExisting
            onViewChange={setView}
          />
        </div>

        <DialogFooter className="m-0 rounded-none border-t border-border bg-muted/30 px-5 py-4">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[0.64rem] text-muted-foreground">
              {documents.length} of {MAX_DOCUMENTS_PER_CHAT} sources used
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Skip for now
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                {documents.length > 0 ? "Start chatting" : "Continue"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
