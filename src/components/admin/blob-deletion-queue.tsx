"use client";

import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminBlobDeletion } from "@/lib/admin/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function BlobDeletionQueue({
  entries,
}: {
  entries: AdminBlobDeletion[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string>();

  async function drain() {
    setPending(true);
    setResult(undefined);

    try {
      const response = await fetch("/api/admin/blob-deletions", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("The queue could not be drained.");
      }

      const payload = (await response.json()) as {
        removed: number;
        remaining: number;
      };

      setResult(
        `Removed ${payload.removed}; ${payload.remaining} left in this batch.`,
      );
      router.refresh();
    } catch (drainError) {
      setResult(
        drainError instanceof Error
          ? drainError.message
          : "The queue could not be drained.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Deletions are retried from oldest to newest, 100 per click. Failures
          stay queued.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => void drain()}
        >
          {pending ? (
            <Loader2Icon aria-hidden="true" className="animate-spin" />
          ) : (
            <RefreshCwIcon aria-hidden="true" />
          )}
          {pending ? "Retrying" : "Retry pending"}
        </Button>
      </div>

      <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">
        {result}
      </p>

      {entries.length === 0 ? (
        <p className="mt-4 border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          Nothing queued. Deleted files were removed from storage.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {entries.map((entry) => (
            <li key={entry.storageKey} className="py-3">
              <p className="truncate font-mono text-[0.68rem] text-foreground">
                {entry.storageKey}
              </p>
              <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">
                {entry.attempts} {entry.attempts === 1 ? "attempt" : "attempts"}{" "}
                / {dateFormatter.format(new Date(entry.createdAt))} UTC
              </p>
              {entry.lastError ? (
                <p className="mt-1 text-xs leading-5 text-destructive">
                  {entry.lastError}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
