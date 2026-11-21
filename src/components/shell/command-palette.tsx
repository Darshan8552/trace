"use client";

import { cn } from "cn";
import {
  ArrowRightIcon,
  KeyboardIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CHAT_TEMPLATES } from "@/lib/chats/templates";
import type { ChatSummary } from "@/lib/chats/types";
import { EMPTY_SEARCH_RESULTS, type SearchResults } from "@/lib/search/types";
import {
  dispatchUiEvent,
  OPEN_COMMAND_PALETTE,
  OPEN_SHORTCUTS,
} from "@/lib/ui/events";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  run: () => void | Promise<void>;
};

const LIST_ID = "command-palette-list";

function optionId(itemId: string): string {
  return `command-option-${itemId}`;
}

type CommandGroup = {
  name: string;
  items: { item: CommandItem; index: number }[];
};

function groupCommandItems(items: CommandItem[]): CommandGroup[] {
  const groups: CommandGroup[] = [];

  items.forEach((item, index) => {
    const current = groups[groups.length - 1];

    if (current?.name === item.group) {
      current.items.push({ item, index });
      return;
    }

    groups.push({ name: item.group, items: [{ item, index }] });
  });

  return groups;
}

export function CommandPalette({
  userName,
  isAdmin,
}: {
  userName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [results, setResults] = useState<SearchResults>(EMPTY_SEARCH_RESULTS);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    function onOpen() {
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpen);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void fetch("/api/chats")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { chats?: ChatSummary[] } | null) => {
        setChats(payload?.chats?.slice(0, 8) ?? []);
      })
      .catch(() => setChats([]));
  }, [open]);

  useEffect(() => {
    const normalized = query.trim();

    if (normalized.length < 2) {
      setResults(EMPTY_SEARCH_RESULTS);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`/api/search?q=${encodeURIComponent(normalized)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: SearchResults | null) => {
          setResults(payload ?? EMPTY_SEARCH_RESULTS);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults(EMPTY_SEARCH_RESULTS);
          }
        });
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const createChat = useCallback(async () => {
    setBusy(true);

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const payload = (await response.json().catch(() => null)) as {
        chat?: { id: string };
        error?: string;
      } | null;

      if (!response.ok || !payload?.chat) {
        throw new Error(payload?.error ?? "The notebook could not be created.");
      }

      router.push(`/chat/${payload.chat.id}?setup=1`);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }, [router]);

  const createTemplate = useCallback(
    async (templateId: string) => {
      setBusy(true);

      try {
        const response = await fetch("/api/notebooks/template", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ template: templateId }),
        });
        const payload = (await response.json().catch(() => null)) as {
          chatId?: string;
          error?: string;
        } | null;

        if (!response.ok || !payload?.chatId) {
          throw new Error(
            payload?.error ?? "The template notebook could not be created.",
          );
        }

        router.push(
          `/chat/${payload.chatId}?template=${encodeURIComponent(templateId)}`,
        );
        setOpen(false);
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const createDemo = useCallback(async () => {
    setBusy(true);

    try {
      const response = await fetch("/api/notebooks/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const payload = (await response.json().catch(() => null)) as {
        chatId?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.chatId) {
        throw new Error(
          payload?.error ?? "The demo notebook could not be created.",
        );
      }

      router.push(`/chat/${payload.chatId}`);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }, [router]);

  const go = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
    },
    [router],
  );

  const items = useMemo<CommandItem[]>(() => {
    const normalized = query.trim().toLowerCase();
    const actions: CommandItem[] = [
      {
        id: "new",
        label: "New notebook",
        hint: "Start an empty chat",
        group: "Actions",
        run: () => createChat(),
      },
      {
        id: "demo",
        label: "Try a demo notebook",
        hint: "Three ready-to-question sources",
        group: "Actions",
        run: () => createDemo(),
      },
      ...CHAT_TEMPLATES.map((template) => ({
        id: `template-${template.id}`,
        label: template.label,
        hint: template.description,
        group: "Templates",
        run: () => createTemplate(template.id),
      })),
      {
        id: "settings",
        label: "Settings",
        hint: `Signed in as ${userName}`,
        group: "Navigate",
        run: () => go("/settings"),
      },
      ...(isAdmin
        ? [
            {
              id: "admin",
              label: "Operations",
              hint: "Admin dashboard",
              group: "Navigate",
              run: () => go("/admin"),
            },
          ]
        : []),
      {
        id: "shortcuts",
        label: "Keyboard shortcuts",
        hint: "Show available shortcuts",
        group: "Navigate",
        run: () => {
          dispatchUiEvent(OPEN_SHORTCUTS);
          setOpen(false);
        },
      },
      ...chats.map((chat) => ({
        id: `recent-${chat.id}`,
        label: chat.title,
        hint: "Recent notebook",
        group: "Recent",
        run: () => go(`/chat/${chat.id}`),
      })),
      ...results.notebooks.map((notebook) => ({
        id: `result-notebook-${notebook.id}`,
        label: notebook.title,
        hint: "Notebook",
        group: "Search results",
        run: () => go(`/chat/${notebook.id}`),
      })),
      ...results.answers.map((answer) => ({
        id: `result-answer-${answer.messageId}`,
        label: answer.snippet,
        hint: answer.chatTitle,
        group: "Search results",
        run: () => go(`/chat/${answer.chatId}?message=${answer.messageId}`),
      })),
      ...results.sources.map((source) => ({
        id: `result-source-${source.chunkId}`,
        label: source.snippet,
        hint: `${source.chatTitle} / ${source.documentTitle}`,
        group: "Search results",
        run: () =>
          go(
            `/chat/${source.chatId}/source/${source.documentId}?chunk=${encodeURIComponent(source.chunkId)}`,
          ),
      })),
    ];

    if (!normalized) {
      return actions;
    }

    return actions.filter((item) =>
      `${item.label} ${item.hint ?? ""}`.toLowerCase().includes(normalized),
    );
  }, [
    chats,
    createChat,
    createDemo,
    createTemplate,
    go,
    isAdmin,
    query,
    results,
    userName,
  ]);

  const activeIndex = Math.min(selected, Math.max(0, items.length - 1));
  const activeItem = items[activeIndex];
  const activeOptionId = activeItem ? optionId(activeItem.id) : undefined;
  const groups = groupCommandItems(items);

  useEffect(() => {
    if (!open || !activeOptionId) {
      return;
    }

    document
      .getElementById(activeOptionId)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeOptionId, open]);

  function runItem(item: CommandItem) {
    setError(null);

    void Promise.resolve(item.run()).catch((caught) => {
      setError(
        caught instanceof Error
          ? caught.message
          : "That command could not run.",
      );
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((value) => (value + 1) % Math.max(1, items.length));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((value) =>
        value <= 0 ? Math.max(0, items.length - 1) : value - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = items[activeIndex];

      if (item) {
        runItem(item);
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);

        if (!next) {
          setError(null);
        }
      }}
    >
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Search notebooks or run a command.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <SearchIcon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          <Input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={LIST_ID}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search notebooks or type a command…"
            aria-label="Search notebooks and commands"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          {busy ? (
            <Loader2Icon
              aria-hidden="true"
              className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
            />
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className="border-b border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive"
          >
            {error}
          </p>
        ) : null}

        <div className="scrollbar-subtle max-h-[60vh] overflow-y-auto p-2">
          <div
            id={LIST_ID}
            role="listbox"
            aria-label="Commands and notebooks"
            className="flex flex-col"
          >
            {groups.map((group) => (
              <fieldset key={group.name} className="m-0 min-w-0 border-0 p-0">
                <legend className="px-2 pt-3 pb-1 font-mono text-[0.58rem] tracking-[0.08em] text-muted-foreground uppercase">
                  {group.name}
                </legend>
                {group.items.map(({ item, index }) => (
                  <div
                    key={item.id}
                    id={optionId(item.id)}
                    role="option"
                    aria-selected={index === activeIndex}
                    tabIndex={-1}
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => runItem(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        runItem(item);
                      }
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-[2px] px-2 py-2 text-left transition-colors",
                      index === activeIndex ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    {item.group === "Actions" ? (
                      <PlusIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-highlight"
                      />
                    ) : item.group === "Templates" ? (
                      <SparklesIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-highlight"
                      />
                    ) : item.group === "Navigate" ? (
                      item.id === "settings" ? (
                        <SettingsIcon
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-muted-foreground"
                        />
                      ) : item.id === "admin" ? (
                        <ShieldCheckIcon
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-muted-foreground"
                        />
                      ) : (
                        <KeyboardIcon
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-muted-foreground"
                        />
                      )
                    ) : (
                      <ArrowRightIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {item.label}
                      </span>
                      {item.hint ? (
                        <span className="block truncate font-mono text-[0.58rem] text-muted-foreground">
                          {item.hint}
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </fieldset>
            ))}
          </div>

          {items.length === 0 ? (
            <output className="block px-2 py-8 text-center text-sm text-muted-foreground">
              No commands match “{query.trim()}”.
            </output>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
