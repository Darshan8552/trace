"use client";

import { Loader2Icon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminFailedDocument } from "@/lib/admin/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FailedDocumentList({
  documents,
}: {
  documents: AdminFailedDocument[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string>();
  const [error, setError] = useState<string>();

  async function retry(documentId: string) {
    setPendingId(documentId);
    setError(undefined);

    try {
      const response = await fetch(
        `/api/admin/documents/${documentId}/process`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reindex: true }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(
          payload?.error ?? "This source could not be reprocessed.",
        );
      }

      router.refresh();
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : "This source could not be reprocessed.",
      );
    } finally {
      setPendingId(undefined);
    }
  }

  if (documents.length === 0) {
    return (
      <p className="border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
        No failed sources. Everything that was indexed is readable.
      </p>
    );
  }

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-border border-y border-border">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                href={`/chat/${document.chatId}`}
                className="rounded-[2px] text-sm font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                {document.title}
              </Link>
              <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">
                {document.userEmail} / {document.chatTitle} /{" "}
                {formatBytes(document.sizeBytes)} /{" "}
                {dateFormatter.format(new Date(document.updatedAt))} UTC
              </p>
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-destructive">
                {document.error ?? "No error message was recorded."}
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pendingId === document.id}
              onClick={() => void retry(document.id)}
            >
              {pendingId === document.id ? (
                <Loader2Icon aria-hidden="true" className="animate-spin" />
              ) : (
                <RotateCcwIcon aria-hidden="true" />
              )}
              {pendingId === document.id ? "Retrying" : "Retry"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
