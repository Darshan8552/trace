"use client";

import { PlusIcon, SearchIcon, SparklesIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatCard } from "@/components/chat/chat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHAT_TEMPLATES, type ChatTemplate } from "@/lib/chats/templates";
import type { ChatSummary } from "@/lib/chats/types";
import { EMPTY_SEARCH_RESULTS, type SearchResults } from "@/lib/search/types";

function HighlightedSnippet({ text }: { text: string }) {
  return (
    <>
      {text.split(/(«[^»]*»)/g).map((part) =>
        part.startsWith("«") ? (
          <mark key={part} className="bg-highlight/25 text-foreground">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <span key={part}>{part}</span>
        ),
      )}
    </>
  );
}

function sortedChats(chats: ChatSummary[]): ChatSummary[] {
  return [...chats].sort(
    (left, right) =>
      Number(right.isPinned) - Number(left.isPinned) ||
      right.updatedAt.localeCompare(left.updatedAt),
  );
}

export function ChatLibrary({ chats }: { chats: ChatSummary[] }) {
  const router = useRouter();
  const [items, setItems] = useState(chats);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(
    null,
  );
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_SEARCH_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageCount = items.reduce(
    (total, chat) => total + chat.messageCount,
    0,
  );
  const sourceCount = items.reduce(
    (total, chat) => total + chat.documentCount,
    0,
  );
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setResults(EMPTY_SEARCH_RESULTS);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);

      fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((payload: SearchResults) => setResults(payload))
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults(EMPTY_SEARCH_RESULTS);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedQuery]);

  const hasResults =
    results.notebooks.length + results.answers.length + results.sources.length >
    0;
  const visibleChats = normalizedQuery
    ? items.filter(
        (chat) =>
          chat.title.toLowerCase().includes(normalizedQuery) ||
          (chat.preview ?? "").toLowerCase().includes(normalizedQuery),
      )
    : items;
  const isCreatingAny =
    isCreating || isCreatingDemo || creatingTemplateId !== null;

  async function createChat() {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });

      if (!response.ok) {
        throw new Error("A new notebook could not be created.");
      }

      const payload = (await response.json()) as { chat: ChatSummary };
      router.push(`/chat/${payload.chat.id}?setup=1`);
    } catch (createError) {
      setIsCreating(false);
      setError(
        createError instanceof Error
          ? createError.message
          : "A new notebook could not be created.",
      );
    }
  }

  async function createDemo() {
    setIsCreatingDemo(true);
    setError(null);

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
    } catch (demoError) {
      setIsCreatingDemo(false);
      setError(
        demoError instanceof Error
          ? demoError.message
          : "The demo notebook could not be created.",
      );
    }
  }

  async function createFromTemplate(template: ChatTemplate) {
    setCreatingTemplateId(template.id);
    setError(null);

    try {
      const response = await fetch("/api/notebooks/template", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template: template.id }),
      });
      const payload = (await response.json().catch(() => null)) as {
        chatId?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.chatId) {
        throw new Error(
          payload?.error ?? "That notebook could not be created.",
        );
      }

      router.push(
        `/chat/${payload.chatId}?template=${encodeURIComponent(template.id)}`,
      );
    } catch (templateError) {
      setCreatingTemplateId(null);
      setError(
        templateError instanceof Error
          ? templateError.message
          : "That notebook could not be created.",
      );
    }
  }

  async function togglePin(id: string, pinned: boolean) {
    const original = items.find((chat) => chat.id === id);

    setPinningId(id);
    setError(null);

    setItems((current) =>
      sortedChats(
        current.map((chat) =>
          chat.id === id ? { ...chat, isPinned: pinned } : chat,
        ),
      ),
    );

    try {
      const response = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pinned }),
      });

      if (!response.ok) {
        throw new Error("That notebook could not be pinned.");
      }
    } catch (pinError) {
      if (original) {
        setItems((current) =>
          sortedChats(
            current.map((chat) =>
              chat.id === id && chat.isPinned === pinned
                ? { ...chat, isPinned: original.isPinned }
                : chat,
            ),
          ),
        );
      }

      setError(
        pinError instanceof Error
          ? pinError.message
          : "That notebook could not be pinned.",
      );
    } finally {
      setPinningId(null);
    }
  }

  async function deleteChat(id: string) {
    const index = items.findIndex((chat) => chat.id === id);
    const removed = items[index];

    setDeletingId(id);
    setError(null);
    setItems((current) => current.filter((chat) => chat.id !== id));

    try {
      const response = await fetch(`/api/chats/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("That chat could not be deleted.");
      }

      setConfirmingId(null);
    } catch (deleteError) {
      if (removed) {
        setItems((current) => {
          if (current.some((chat) => chat.id === removed.id)) {
            return current;
          }

          const next = [...current];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        });
      }

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "That chat could not be deleted.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function askRename(chat: ChatSummary) {
    setError(null);
    setConfirmingId(null);
    setRenamingId(chat.id);
    setRenameValue(chat.title);
  }

  function cancelRename() {
    if (isSavingRename) {
      return;
    }

    setRenamingId(null);
    setRenameValue("");
  }

  async function saveRename(id: string) {
    const nextTitle = renameValue.trim();

    if (!nextTitle || isSavingRename) {
      return;
    }

    const originalTitle = items.find((chat) => chat.id === id)?.title;

    setIsSavingRename(true);
    setError(null);
    setItems((current) =>
      current.map((chat) =>
        chat.id === id ? { ...chat, title: nextTitle } : chat,
      ),
    );

    try {
      const response = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });

      if (!response.ok) {
        throw new Error("That notebook could not be renamed.");
      }

      const payload = (await response.json()) as {
        chat: { id: string; title: string };
      };

      setItems((current) =>
        current.map((chat) =>
          chat.id === id ? { ...chat, title: payload.chat.title } : chat,
        ),
      );
      setRenamingId(null);
      setRenameValue("");
    } catch (renameError) {
      if (originalTitle !== undefined) {
        setItems((current) =>
          current.map((chat) =>
            chat.id === id && chat.title === nextTitle
              ? { ...chat, title: originalTitle }
              : chat,
          ),
        );
      }

      setError(
        renameError instanceof Error
          ? renameError.message
          : "That notebook could not be renamed.",
      );
    } finally {
      setIsSavingRename(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 pb-16 sm:px-8 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6 border-b border-border pb-8">
        <div>
          <p className="flex items-center gap-2 font-mono text-[0.65rem] text-muted-foreground">
            <span aria-hidden="true" className="h-px w-4 bg-highlight" />
            Index / notebooks
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.25rem,4.6vw,3.25rem)] leading-[1.02] tracking-[-0.025em]">
            Your notebooks
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Every chat keeps its own thread, answers, and sources. Open one to
            continue where you left off.
          </p>
        </div>

        <Button
          type="button"
          className="h-10 gap-2 px-4"
          disabled={isCreatingAny}
          onClick={() => void createChat()}
        >
          <PlusIcon aria-hidden="true" className="size-4" />
          {isCreating ? "Creating…" : "New notebook"}
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.62rem] text-muted-foreground">
          <p>
            {normalizedQuery
              ? `${visibleChats.length} of ${items.length}`
              : items.length}{" "}
            {items.length === 1 ? "notebook" : "notebooks"}
          </p>
          <p>
            {messageCount} {messageCount === 1 ? "message" : "messages"}
          </p>
          <p>
            {sourceCount} {sourceCount === 1 ? "source" : "sources"}
          </p>
        </div>

        {items.length > 0 ? (
          <div className="relative w-full sm:w-64">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              placeholder="Search everything…"
              aria-label="Search notebooks, answers, and sources"
              className="h-8 pr-8 pl-8"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-[2px] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                <XIcon aria-hidden="true" className="size-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {normalizedQuery.length >= 2 ? (
        <section
          aria-label="Search results"
          className="mt-4 border border-border bg-surface/40"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              Workspace search / “{query.trim()}”
            </p>
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              {isSearching ? "Searching…" : "Done"}
            </p>
          </div>

          {!hasResults && !isSearching ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notebooks, answers, or passages match.
            </p>
          ) : (
            <div className="divide-y divide-border/70">
              {results.notebooks.length > 0 ? (
                <div className="px-4 py-3">
                  <p className="font-mono text-[0.6rem] tracking-[0.06em] text-muted-foreground uppercase">
                    Notebooks
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {results.notebooks.map((notebook) => (
                      <li key={notebook.id}>
                        <Link
                          href={`/chat/${notebook.id}`}
                          className="text-sm font-medium underline-offset-4 hover:text-highlight hover:underline"
                        >
                          {notebook.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {results.answers.length > 0 ? (
                <div className="px-4 py-3">
                  <p className="font-mono text-[0.6rem] tracking-[0.06em] text-muted-foreground uppercase">
                    Answers
                  </p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {results.answers.map((answer) => (
                      <li key={answer.messageId}>
                        <Link
                          href={`/chat/${answer.chatId}?message=${encodeURIComponent(answer.messageId)}`}
                          className="block text-sm leading-6 hover:text-highlight"
                        >
                          <span className="font-mono text-[0.6rem] text-muted-foreground">
                            {answer.chatTitle} /
                          </span>{" "}
                          <HighlightedSnippet text={answer.snippet} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {results.sources.length > 0 ? (
                <div className="px-4 py-3">
                  <p className="font-mono text-[0.6rem] tracking-[0.06em] text-muted-foreground uppercase">
                    Source passages
                  </p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {results.sources.map((source) => (
                      <li key={source.chunkId}>
                        <Link
                          href={`/chat/${source.chatId}/source/${source.documentId}?chunk=${encodeURIComponent(source.chunkId)}`}
                          className="block text-sm leading-6 hover:text-highlight"
                        >
                          <span className="font-mono text-[0.6rem] text-muted-foreground">
                            {source.chatTitle} / {source.documentTitle}
                            {source.page ? ` / p. ${source.page}` : ""} /
                          </span>{" "}
                          <HighlightedSnippet text={source.snippet} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-4 border-t border-border">
          <div className="flex flex-col items-start gap-5 border-b border-border py-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid max-w-xl grid-cols-[2.5rem_1fr] gap-x-5">
              <span className="font-display text-[2.5rem] leading-none text-highlight">
                00
              </span>
              <div>
                <h2 className="font-display text-2xl">No notebooks yet</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Start a chat, add your sources, and ask your first question.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="gap-1.5"
                  disabled={isCreatingAny}
                  onClick={() => void createChat()}
                >
                  <PlusIcon aria-hidden="true" className="size-4" />
                  {isCreating ? "Creating…" : "Start your first notebook"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isCreatingAny}
                  onClick={() => void createDemo()}
                >
                  <SparklesIcon aria-hidden="true" className="size-4" />
                  {isCreatingDemo ? "Preparing…" : "Try a demo notebook"}
                </Button>
              </div>
              <p className="font-mono text-[0.6rem] text-muted-foreground">
                Demo: three short sources, ready to question
              </p>
            </div>
          </div>

          <div className="py-8">
            <p className="font-mono text-[0.62rem] tracking-[0.06em] text-muted-foreground uppercase">
              Or start from a template
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {CHAT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  disabled={isCreatingAny}
                  onClick={() => void createFromTemplate(template)}
                  className="flex flex-col items-start gap-1 border border-border px-4 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-surface/60 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
                >
                  <span className="font-display text-lg leading-snug tracking-[-0.01em]">
                    {template.label}
                  </span>
                  <span className="text-xs leading-5 text-muted-foreground">
                    {template.description}
                  </span>
                  <span className="mt-1 font-mono text-[0.58rem] text-highlight">
                    {creatingTemplateId === template.id
                      ? "Creating…"
                      : `${template.questions.length} starter questions`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 border-t border-border">
          <div className="hidden grid-cols-[2rem_1fr_5.5rem_3rem_3rem_5.5rem] gap-4 border-b border-border py-2 font-mono text-[0.62rem] text-muted-foreground sm:grid lg:grid-cols-[2.5rem_1fr_7rem_4rem_4.5rem_5.5rem]">
            <span>No.</span>
            <span>Notebook</span>
            <span>Last activity</span>
            <span>Sources</span>
            <span>Messages</span>
            <span />
          </div>

          {visibleChats.length === 0 ? (
            <div className="border-b border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No notebooks match “{query.trim()}”.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setQuery("")}
              >
                Clear search
              </Button>
            </div>
          ) : (
            visibleChats.map((chat, index) => (
              <ChatCard
                key={chat.id}
                chat={chat}
                index={index}
                isConfirming={confirmingId === chat.id}
                isDeleting={deletingId === chat.id}
                isRenaming={renamingId === chat.id}
                renameValue={renameValue}
                isSavingRename={isSavingRename}
                isPinning={pinningId === chat.id}
                onTogglePin={() => void togglePin(chat.id, !chat.isPinned)}
                onRenameChange={setRenameValue}
                onAskRename={() => askRename(chat)}
                onCancelRename={cancelRename}
                onSaveRename={() => void saveRename(chat.id)}
                onAskDelete={() => {
                  setError(null);
                  setConfirmingId(chat.id);
                }}
                onCancelDelete={() => setConfirmingId(null)}
                onDelete={() => void deleteChat(chat.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
