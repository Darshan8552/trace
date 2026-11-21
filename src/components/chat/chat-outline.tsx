"use client";

import { cn } from "cn";
import type { ChatTurn } from "@/lib/chat/outline";

export function ChatOutline({
  turns,
  activeTurnId,
  onSelect,
  className,
}: {
  turns: ChatTurn[];
  activeTurnId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Conversation outline"
      className={cn("flex min-h-0 flex-col", className)}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <p className="font-mono text-[0.62rem] text-muted-foreground">Thread</p>
        <p className="font-mono text-[0.62rem] text-muted-foreground">
          {turns.length} {turns.length === 1 ? "turn" : "turns"}
        </p>
      </div>

      <ol className="scrollbar-subtle mt-1 min-h-0 flex-1 overflow-y-auto">
        {turns.map((turn, index) => {
          const isActive = turn.id === activeTurnId;

          return (
            <li key={turn.id}>
              <button
                type="button"
                title={turn.text}
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSelect(turn.id)}
                className={cn(
                  "flex w-full items-start gap-2 border-l-2 px-2 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                  isActive
                    ? "border-highlight bg-muted/60"
                    : "border-transparent hover:border-border hover:bg-muted/40",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pt-0.5 font-mono text-[0.6rem]",
                    isActive ? "text-highlight" : "text-muted-foreground",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "line-clamp-2 min-w-0 text-xs leading-5",
                    isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {turn.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
