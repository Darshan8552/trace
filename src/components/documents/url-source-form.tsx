"use client";

import { ClipboardPasteIcon, Link2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DocumentSummary } from "@/lib/documents/types";

export function UrlSourceForm({
  chatId,
  disabled = false,
  onAdded,
}: {
  chatId: string;
  disabled?: boolean;
  onAdded: (document: DocumentSummary) => void;
}) {
  const [url, setUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedUrl = url.trim();

  async function handleAdd() {
    if (!trimmedUrl || isSaving) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/documents/from-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chatId, url: trimmedUrl }),
      });
      const payload = (await response.json().catch(() => null)) as {
        document?: DocumentSummary;
        error?: string;
      } | null;

      if (!response.ok || !payload?.document) {
        throw new Error(
          payload?.error ?? "That page could not be added as a source.",
        );
      }

      onAdded(payload.document);
      setUrl("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "That page could not be added as a source.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClipboardPaste() {
    if (isSaving) {
      return;
    }

    setError(null);

    try {
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText.trim()) {
        setError("Your clipboard is empty.");
        return;
      }

      setUrl(clipboardText.trim());
    } catch {
      setError(
        "Clipboard access was blocked. Paste with Ctrl/Cmd + V instead.",
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Input
        value={url}
        type="url"
        inputMode="url"
        maxLength={2048}
        placeholder="https://example.com/article"
        aria-label="Web page address"
        disabled={disabled || isSaving}
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void handleAdd();
          }
        }}
      />

      <p className="text-xs leading-5 text-muted-foreground">
        Public web pages only. The readable text is saved as a source; images,
        scripts, and page navigation are left out.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[0.62rem] text-muted-foreground">
          Ctrl/Cmd + Enter to add
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled || isSaving}
            onClick={() => void handleClipboardPaste()}
          >
            <ClipboardPasteIcon aria-hidden="true" data-icon="inline-start" />
            Paste
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={disabled || isSaving || !trimmedUrl}
            onClick={() => void handleAdd()}
          >
            <Link2Icon aria-hidden="true" data-icon="inline-start" />
            {isSaving ? "Adding…" : "Add page"}
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
