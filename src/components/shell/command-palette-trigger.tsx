"use client";

import { CommandIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { dispatchUiEvent, OPEN_COMMAND_PALETTE } from "@/lib/ui/events";
import { commandPaletteShortcut } from "@/lib/ui/platform";

export function CommandPaletteTrigger() {
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    setShortcut(commandPaletteShortcut(navigator.userAgent));
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={
        shortcut ? `${shortcut} — open command palette` : "Open command palette"
      }
      title={
        shortcut ? `Search and commands (${shortcut})` : "Search and commands"
      }
      onClick={() => dispatchUiEvent(OPEN_COMMAND_PALETTE)}
      className="shrink-0 gap-1.5 text-muted-foreground"
    >
      <CommandIcon aria-hidden="true" className="size-3.5" />
      {shortcut ? (
        <span className="hidden min-w-8 text-center font-mono text-[0.62rem] lg:inline">
          {shortcut}
        </span>
      ) : null}
    </Button>
  );
}
