"use client";

import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function ChatComposer({
  value,
  onValueChange,
  onSend,
  onStop,
  isBusy,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  isBusy: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !isBusy;

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    if (value) {
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }, [value]);

  function submit() {
    if (canSend) {
      onSend(value.trim());
    }
  }

  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="rounded-[3px] border border-input bg-surface transition-[border-color,box-shadow] focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/10">
        <div className="flex items-end gap-1 p-1.5">
          <label htmlFor="chat-composer" className="sr-only">
            Ask a question about your documents
          </label>
          <textarea
            ref={textareaRef}
            id="chat-composer"
            rows={1}
            value={value}
            placeholder="Ask your documents…"
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                submit();
              }
            }}
            className="max-h-44 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-5 outline-none placeholder:text-muted-foreground"
          />

          {isBusy ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-9 shrink-0 rounded-[2px]"
              aria-label="Stop answering"
              onClick={onStop}
            >
              <SquareIcon aria-hidden="true" className="size-3.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className="size-9 shrink-0 rounded-[2px]"
              aria-label="Send question"
              disabled={!canSend}
            >
              <ArrowUpIcon aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-0.5 font-mono text-[0.62rem] leading-5 text-muted-foreground">
        <span>Answers cite the page they came from.</span>
        <span className="hidden sm:inline">
          Enter sends / Shift + Enter adds a line
        </span>
      </div>
    </form>
  );
}
