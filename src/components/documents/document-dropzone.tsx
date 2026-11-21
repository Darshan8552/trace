"use client";

import { cn } from "cn";
import { CircleAlertIcon, Loader2Icon, UploadCloudIcon } from "lucide-react";
import { useRef, useState } from "react";
import { uploadDocument } from "@/lib/documents/client";
import type { DocumentSummary } from "@/lib/documents/types";
import {
  MAX_DOCUMENTS_PER_CHAT,
  rejectionForFilename,
  uploadPolicy,
} from "@/lib/documents/upload";

type UploadProgress = {
  done: number;
  total: number;
};

export function DocumentDropzone({
  userId,
  chatId,
  currentCount = 0,
  maxFiles = MAX_DOCUMENTS_PER_CHAT,
  spreadsheetsEnabled = false,
  onUploaded,
  onBatchComplete,
}: {
  userId: string;
  chatId: string;
  currentCount?: number;
  maxFiles?: number;
  spreadsheetsEnabled?: boolean;
  onUploaded: (document: DocumentSummary) => void;
  onBatchComplete?: (addedCount: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isUploading = progress !== null;
  const remaining = Math.max(maxFiles - currentCount, 0);
  const policy = uploadPolicy(spreadsheetsEnabled);

  async function handleFiles(files: FileList | null) {
    const selected = files ? Array.from(files) : [];

    if (selected.length === 0 || isUploading) {
      return;
    }

    setError(null);

    if (remaining === 0) {
      setError(
        `This chat already holds ${maxFiles} documents. Remove one before adding another.`,
      );
      return;
    }

    const batch = selected.slice(0, remaining);

    if (selected.length > batch.length) {
      setError(
        `Only ${remaining} more ${remaining === 1 ? "document" : "documents"} can be added to this chat.`,
      );
    }

    setProgress({ done: 0, total: batch.length });

    const failures: string[] = [];
    let addedCount = 0;

    for (const [index, file] of batch.entries()) {
      const rejection = rejectionForFilename(file.name, spreadsheetsEnabled);

      if (rejection) {
        failures.push(`${file.name}: ${rejection}`);
      } else {
        try {
          onUploaded(await uploadDocument({ file, userId, chatId }));
          addedCount += 1;
        } catch (uploadError) {
          failures.push(
            `${file.name}: ${
              uploadError instanceof Error
                ? uploadError.message
                : "The upload failed."
            }`,
          );
        }
      }

      setProgress({ done: index + 1, total: batch.length });
    }

    setProgress(null);

    if (failures.length > 0) {
      setError(failures.join(" "));
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onBatchComplete?.(addedCount);
  }

  return (
    <fieldset
      className="m-0 min-w-0 border-0 p-0"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        void handleFiles(event.dataTransfer.files);
      }}
    >
      <legend className="sr-only">Add documents</legend>

      <div
        className={cn(
          "rounded-[3px] border border-dashed px-4 py-5 transition-colors",
          isDragging
            ? "border-highlight/70 bg-highlight/5"
            : "border-muted-foreground/40 bg-surface/40 hover:border-foreground/30",
          remaining === 0 && "opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={policy.accept}
          multiple
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-8 items-center justify-center border border-border bg-surface text-muted-foreground">
            {isUploading ? (
              <Loader2Icon
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <UploadCloudIcon aria-hidden="true" className="size-4" />
            )}
          </span>

          <button
            type="button"
            disabled={isUploading || remaining === 0}
            onClick={() => inputRef.current?.click()}
            className="rounded-[2px] text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-60"
          >
            {isUploading
              ? `Uploading ${progress.done} of ${progress.total}…`
              : "Choose documents"}
          </button>

          <p className="font-mono text-[0.62rem] leading-5 text-muted-foreground">
            {policy.label} / 20 MB each / {currentCount} of {maxFiles} used
          </p>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-destructive"
        >
          <CircleAlertIcon
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0"
          />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
