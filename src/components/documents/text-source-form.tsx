"use client";

import { ClipboardPasteIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadTextDocument } from "@/lib/documents/client";
import type { DocumentSummary } from "@/lib/documents/types";
import { formatCount, MAX_PASTED_TEXT_CHARS } from "@/lib/documents/upload";

export function TextSourceForm({
  userId,
  chatId,
  disabled = false,
  onAdded,
}: {
  userId: string;
  chatId: string;
  disabled?: boolean;
  onAdded: (document: DocumentSummary) => void;
}) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedText = text.trim();
  const isFull = trimmedText.length > MAX_PASTED_TEXT_CHARS;

  async function handleAdd() {
    if (!trimmedText || isSaving || isFull) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      onAdded(await uploadTextDocument({ userId, chatId, title, text }));
      setTitle("");
      setText("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The text could not be saved.",
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

      setText((current) =>
        current.trim()
          ? `${current.trimEnd()}\n\n${clipboardText}`
          : clipboardText,
      );
    } catch {
      setError(
        "Clipboard access was blocked. Paste with Ctrl/Cmd + V instead.",
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Input
        value={title}
        maxLength={160}
        placeholder="Title (optional)"
        aria-label="Pasted text title"
        disabled={disabled || isSaving}
        onChange={(event) => setTitle(event.target.value)}
      />

      <Textarea
        value={text}
        placeholder="Paste notes, an article, or any text you want to ask about…"
        aria-label="Paste text as a source"
        className="min-h-40 flex-1 resize-none"
        disabled={disabled || isSaving}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void handleAdd();
          }
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={
              isFull
                ? "font-mono text-[0.62rem] text-destructive"
                : "font-mono text-[0.62rem] text-muted-foreground"
            }
          >
            {formatCount(trimmedText.length)} /{" "}
            {formatCount(MAX_PASTED_TEXT_CHARS)}
          </p>
          <p className="font-mono text-[0.62rem] text-muted-foreground">
            Ctrl/Cmd + Enter to add
          </p>
        </div>

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
            disabled={disabled || isSaving || !trimmedText || isFull}
            onClick={() => void handleAdd()}
          >
            {isSaving ? "Adding…" : "Add text"}
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
