"use client";

import {
  FileTextIcon,
  MessageSquareIcon,
  PencilIcon,
  PinIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatSummary } from "@/lib/chats/types";

export function ChatCard({
  chat,
  index,
  isConfirming,
  isDeleting,
  isRenaming,
  renameValue,
  isSavingRename,
  isPinning,
  onTogglePin,
  onRenameChange,
  onAskRename,
  onCancelRename,
  onSaveRename,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  chat: ChatSummary;
  index: number;
  isConfirming: boolean;
  isDeleting: boolean;
  isRenaming: boolean;
  renameValue: string;
  isSavingRename: boolean;
  isPinning: boolean;
  onTogglePin: () => void;
  onRenameChange: (value: string) => void;
  onAskRename: () => void;
  onCancelRename: () => void;
  onSaveRename: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group relative grid grid-cols-[1.75rem_1fr_auto] items-start gap-3 border-b border-border px-1 py-5 transition-colors before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-highlight before:opacity-0 before:transition-opacity hover:bg-surface/60 hover:before:opacity-100 sm:grid-cols-[2rem_1fr_5.5rem_3rem_3rem_5.5rem] sm:items-center sm:gap-4 sm:py-4 lg:grid-cols-[2.5rem_1fr_7rem_4rem_4.5rem_5.5rem]">
      <span
        aria-hidden="true"
        className="pt-1 font-mono text-[0.62rem] text-highlight sm:pt-0"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {isRenaming ? (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Input
              value={renameValue}
              maxLength={120}
              autoFocus
              aria-label={`Rename ${chat.title}`}
              disabled={isSavingRename}
              className="h-8 w-full max-w-sm"
              onChange={(event) => onRenameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSaveRename();
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelRename();
                }
              }}
            />
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="xs"
                disabled={!renameValue.trim() || isSavingRename}
                onClick={onSaveRename}
              >
                {isSavingRename ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                disabled={isSavingRename}
                onClick={onCancelRename}
              >
                Cancel
              </Button>
            </div>
          </div>
          <p className="mt-1 font-mono text-[0.62rem] text-muted-foreground">
            Enter to save, Escape to cancel
          </p>
        </div>
      ) : (
        <Link
          href={`/chat/${chat.id}`}
          className="min-w-0 after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <h2 className="flex items-center gap-1.5 truncate font-display text-[1.15rem] leading-snug tracking-[-0.01em]">
            {chat.isPinned ? (
              <PinIcon
                aria-hidden="true"
                className="size-3 shrink-0 text-highlight"
              />
            ) : null}
            {chat.title}
          </h2>
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">
            {chat.preview ??
              "No messages yet. Open it to ask your first question."}
          </p>
          <p className="mt-2 font-mono text-[0.62rem] text-muted-foreground sm:hidden">
            {chat.updatedLabel} / {chat.messageCount}{" "}
            {chat.messageCount === 1 ? "message" : "messages"} /{" "}
            {chat.documentCount}{" "}
            {chat.documentCount === 1 ? "source" : "sources"}
          </p>
        </Link>
      )}

      <span className="hidden font-mono text-[0.62rem] text-muted-foreground sm:block">
        {chat.updatedLabel}
      </span>

      <span className="hidden items-center gap-1.5 font-mono text-[0.62rem] text-muted-foreground sm:flex">
        <FileTextIcon aria-hidden="true" className="size-3" />
        {chat.documentCount}
      </span>

      <span className="hidden items-center gap-1.5 font-mono text-[0.62rem] text-muted-foreground sm:flex">
        <MessageSquareIcon aria-hidden="true" className="size-3" />
        {chat.messageCount}
      </span>

      <div className="relative z-10 justify-self-end">
        {isRenaming || isConfirming ? null : (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`${chat.isPinned ? "Unpin" : "Pin"} ${chat.title}`}
              aria-pressed={chat.isPinned}
              title={chat.isPinned ? "Unpin notebook" : "Pin notebook"}
              disabled={isPinning}
              className="text-muted-foreground"
              onClick={onTogglePin}
            >
              <PinIcon aria-hidden="true" className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`Rename ${chat.title}`}
              className="text-muted-foreground"
              onClick={onAskRename}
            >
              <PencilIcon aria-hidden="true" className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`Delete ${chat.title}`}
              className="text-muted-foreground hover:text-destructive"
              onClick={onAskDelete}
            >
              <Trash2Icon aria-hidden="true" className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {isConfirming ? (
        <div className="relative z-10 col-span-full flex flex-wrap items-center justify-between gap-2 border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="text-xs leading-5 text-muted-foreground">
            Delete <span className="text-foreground">{chat.title}</span> and its
            messages and sources?
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="xs"
              variant="destructive"
              disabled={isDeleting}
              onClick={onDelete}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={isDeleting}
              onClick={onCancelDelete}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
