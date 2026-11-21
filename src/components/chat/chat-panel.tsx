"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowLeftIcon,
  CircleAlertIcon,
  DownloadIcon,
  LibraryBigIcon,
  ListTreeIcon,
  PlusIcon,
  RotateCcwIcon,
  Share2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatOutline } from "@/components/chat/chat-outline";
import { ShareNotebookDialog } from "@/components/chat/share-notebook-dialog";
import { AddSourceDialog } from "@/components/documents/add-source-dialog";
import { SourcePanel } from "@/components/documents/source-panel";
import { SourceSetupDialog } from "@/components/documents/source-setup-dialog";
import { useDocuments } from "@/components/documents/use-documents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { chatExportFilename, chatToMarkdown } from "@/lib/chat/export";
import { chatTurns, turnAnchorId } from "@/lib/chat/outline";
import type { ChatUIMessage } from "@/lib/chat/types";
import { chatTitleFromQuery } from "@/lib/chats/format";
import { findChatTemplate } from "@/lib/chats/templates";
import type { DocumentSummary } from "@/lib/documents/types";
import type { FeedbackSummary } from "@/lib/feedback/types";
import { OPEN_SHORTCUTS } from "@/lib/ui/events";

function EmptyState({
  documents,
  starterQuestions,
  onAddSource,
  onSuggestion,
}: {
  documents: DocumentSummary[];
  starterQuestions: string[];
  onAddSource: () => void;
  onSuggestion: (text: string) => void;
}) {
  const hasSources = documents.length > 0;
  const firstSource = documents[0];
  const isIndexing = documents.some(
    (document) =>
      document.status === "PENDING" || document.status === "PROCESSING",
  );
  const suggestions =
    starterQuestions.length > 0
      ? starterQuestions
      : hasSources && firstSource
        ? [
            `Summarize ${firstSource.title}`,
            `What are the key points in ${firstSource.title}?`,
            ...(documents.length > 1
              ? ["What do these sources agree on?"]
              : []),
          ]
        : [];

  return (
    <div className="flex flex-1 flex-col justify-center py-6">
      <div className="flex items-center gap-2 font-mono text-[0.62rem] text-muted-foreground">
        <span aria-hidden="true" className="h-px w-4 bg-highlight" />
        {hasSources ? "Ready / ask" : "Start / add a source"}
      </div>

      <h2 className="mt-4 max-w-lg font-display text-[clamp(2rem,4.6vw,2.75rem)] leading-[1.05] tracking-[-0.025em] text-balance">
        {hasSources || starterQuestions.length > 0
          ? "Ask your first question."
          : "Add a source to begin."}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {hasSources
          ? "Your sources are in the panel beside this chat. Start with a suggestion or ask your own question — answers point back to the page they came from."
          : starterQuestions.length > 0
            ? "Start with one of these questions, or ask your own. Add sources whenever you want answers tied to a page."
            : "Your documents stay in the sources panel beside this chat. Add one and ask your first question — every answer points back to the page it came from."}
      </p>

      {suggestions.length > 0 ? (
        <>
          {starterQuestions.length > 0 ? (
            <p className="mt-6 font-mono text-[0.62rem] tracking-[0.06em] text-muted-foreground uppercase">
              Starter questions
            </p>
          ) : null}

          <div
            className={`flex max-w-md flex-col items-start gap-2 ${
              starterQuestions.length > 0 ? "mt-2" : "mt-6"
            }`}
          >
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto max-w-full justify-start py-2 text-left whitespace-normal"
                onClick={() => onSuggestion(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </>
      ) : null}

      {hasSources ? (
        <>
          {isIndexing ? (
            <p className="mt-4 font-mono text-[0.62rem] text-muted-foreground">
              Some sources are still indexing — answers may be incomplete.
            </p>
          ) : null}

          <p className="mt-4 font-mono text-[0.62rem] text-muted-foreground">
            Or ask your own question below.
          </p>
        </>
      ) : (
        <>
          <Button
            type="button"
            className="mt-6 w-fit gap-1.5"
            onClick={onAddSource}
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            Add a source
          </Button>

          <p className="mt-4 font-mono text-[0.62rem] text-muted-foreground">
            You can still ask a general question below.
          </p>
        </>
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="border-l border-border pl-4 sm:pl-5">
      <p className="font-mono text-[0.62rem] text-muted-foreground">
        Trace / writing
      </p>
      <output
        className="mt-3 flex items-center gap-1"
        aria-label="Writing an answer"
      >
        <span className="size-1.5 animate-pulse rounded-full bg-highlight motion-reduce:animate-none" />
        <span className="size-1.5 animate-pulse rounded-full bg-highlight [animation-delay:150ms] motion-reduce:animate-none" />
        <span className="size-1.5 animate-pulse rounded-full bg-highlight [animation-delay:300ms] motion-reduce:animate-none" />
      </output>
    </div>
  );
}

function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{message}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
        onClick={onRetry}
      >
        <RotateCcwIcon aria-hidden="true" className="size-3.5" />
        Try again
      </Button>
    </div>
  );
}

export function ChatPanel({
  userId,
  chatId,
  chatTitle,
  viewerName,
  initialMessages,
  initialFeedback = {},
  initialShareSlug,
  focusMessageId,
  openSetup = false,
  templateId,
  spreadsheetsEnabled = false,
}: {
  userId: string;
  chatId: string;
  chatTitle: string;
  viewerName: string;
  initialMessages: ChatUIMessage[];
  initialFeedback?: Record<string, FeedbackSummary>;
  initialShareSlug?: string | null;
  focusMessageId?: string;
  openSetup?: boolean;
  templateId?: string;
  spreadsheetsEnabled?: boolean;
}) {
  const router = useRouter();
  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: "/api/chat",
        body: { chatId },
      }),
    [chatId],
  );
  const { messages, sendMessage, status, stop, error, regenerate, clearError } =
    useChat<ChatUIMessage>({ transport, messages: initialMessages });
  const {
    documents,
    isLoading: isLoadingDocuments,
    error: documentsError,
    indexingStalled,
    addDocument,
    deleteDocument,
    retryDocument,
    refreshDocument,
    reindexDocument,
    reindexAll,
    checkAgain,
  } = useDocuments(chatId);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState(chatTitle);
  const [feedbackByMessage, setFeedbackByMessage] = useState(initialFeedback);
  const [shareSlug, setShareSlug] = useState(initialShareSlug ?? null);
  const [shareOpen, setShareOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(openSetup);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const wasBusyRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reopenSourcesRef = useRef(false);
  const addedInSourceDialogRef = useRef(false);
  const shouldFollowRef = useRef(true);
  const scrollFrameRef = useRef<number | null>(null);
  const isBusy = status === "submitted" || status === "streaming";
  const hasConversation = messages.length > 0;
  const turns = useMemo(() => chatTurns(messages), [messages]);
  const starterQuestions = findChatTemplate(templateId)?.questions ?? [];

  useEffect(() => {
    if (!focusMessageId) {
      return;
    }

    const target =
      document.getElementById(`message-${focusMessageId}`) ??
      document.getElementById(turnAnchorId(focusMessageId));

    if (target) {
      shouldFollowRef.current = false;
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [focusMessageId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target?.closest('input, textarea, [contenteditable="true"]') ||
        document.querySelector(
          '[data-slot="dialog-content"], [data-slot="sheet-content"]',
        )
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "c") {
        event.preventDefault();
        document.getElementById("chat-composer")?.focus();
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (key === "s") {
        if (window.matchMedia("(min-width: 1024px)").matches) {
          return;
        }

        event.preventDefault();
        setSourcesOpen((value) => !value);
        return;
      }

      if (key === "j" || key === "k") {
        const answers = Array.from(
          document.querySelectorAll<HTMLElement>("[data-answer-shortcut]"),
        );

        if (answers.length === 0) {
          return;
        }

        event.preventDefault();
        const current = answers.indexOf(document.activeElement as HTMLElement);
        const next =
          key === "j"
            ? Math.min(current + 1, answers.length - 1)
            : Math.max(current <= 0 ? 0 : current - 1, 0);
        const answer = answers[next];

        answer?.focus({ preventScroll: true });
        answer?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    function onOpenShortcuts() {
      setShortcutsOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_SHORTCUTS, onOpenShortcuts);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_SHORTCUTS, onOpenShortcuts);
    };
  }, []);

  useEffect(() => {
    if (wasBusyRef.current && !isBusy && !error) {
      setAnnouncement("Answer ready.");
    }

    wasBusyRef.current = isBusy;
  }, [error, isBusy]);

  useEffect(() => {
    const container = scrollRef.current;

    if (container && messages.length > 0 && shouldFollowRef.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (shouldFollowRef.current && turns.length > 0) {
      setActiveTurnId(turns[turns.length - 1]?.id ?? null);
    }
  }, [turns]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  function updateActiveTurn() {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    const bandTop = container.getBoundingClientRect().top + 24;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      96;

    if (atBottom) {
      setActiveTurnId(turns[turns.length - 1]?.id ?? null);
      return;
    }

    let nextActiveId: string | null = null;

    for (const element of container.querySelectorAll<HTMLElement>(
      "[data-turn-id]",
    )) {
      if (element.getBoundingClientRect().top > bandTop) {
        break;
      }

      nextActiveId = element.dataset.turnId ?? null;
    }

    setActiveTurnId(nextActiveId ?? turns[0]?.id ?? null);
  }

  function handleConversationScroll() {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    shouldFollowRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      96;

    if (scrollFrameRef.current !== null) {
      return;
    }

    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateActiveTurn();
    });
  }

  function scrollToTurn(turnId: string) {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    const target = container.querySelector<HTMLElement>(
      `#${CSS.escape(turnAnchorId(turnId))}`,
    );

    if (!target) {
      return;
    }

    shouldFollowRef.current = false;
    setActiveTurnId(turnId);

    const top =
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      12;

    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  const sourcePanel = (
    <SourcePanel
      documents={documents}
      isLoading={isLoadingDocuments}
      error={documentsError}
      viewerName={viewerName}
      onAddSource={() => {
        reopenSourcesRef.current = sourcesOpen;
        setSourcesOpen(false);
        setAddSourceOpen(true);
      }}
      onDelete={deleteDocument}
      onRetry={retryDocument}
      onRefresh={refreshDocument}
      onReindex={reindexDocument}
      onReindexAll={reindexAll}
      indexingStalled={indexingStalled}
      onCheckAgain={checkAgain}
    />
  );

  function handleSourceAdded(document: DocumentSummary) {
    addedInSourceDialogRef.current = true;
    addDocument(document);
  }

  function handleAddSourceOpenChange(open: boolean) {
    setAddSourceOpen(open);

    if (!open) {
      const shouldReopen =
        addedInSourceDialogRef.current && reopenSourcesRef.current;

      addedInSourceDialogRef.current = false;
      reopenSourcesRef.current = false;

      if (shouldReopen) {
        setSourcesOpen(true);
      }
    }
  }

  function handleExport() {
    if (messages.length === 0) {
      return;
    }

    const markdown = chatToMarkdown({
      title,
      messages,
      origin: window.location.origin,
      chatId,
    });
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = chatExportFilename(title);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function rateAnswer(
    messageId: string,
    rating: "up" | "down",
    reason?: FeedbackSummary["reason"],
    note?: string | null,
  ) {
    const previous = feedbackByMessage[messageId] ?? null;
    const optimistic: FeedbackSummary = {
      rating,
      reason: reason ?? null,
      note: note ?? null,
    };

    setFeedbackByMessage((current) => ({
      ...current,
      [messageId]: optimistic,
    }));

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chatId,
          messageId,
          rating,
          reason: reason ?? null,
          note: note ?? null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        feedback?: FeedbackSummary;
        error?: string;
      } | null;

      if (!response.ok || !payload?.feedback) {
        throw new Error(payload?.error ?? "Your feedback could not be saved.");
      }

      setFeedbackByMessage((current) => ({
        ...current,
        [messageId]: payload.feedback as FeedbackSummary,
      }));
    } catch (error) {
      setFeedbackByMessage((current) => {
        const next = { ...current };

        if (previous) {
          next[messageId] = previous;
        } else {
          delete next[messageId];
        }

        return next;
      });
      throw error;
    }
  }

  async function clearAnswerFeedback(messageId: string) {
    const previous = feedbackByMessage[messageId] ?? null;
    const next = { ...feedbackByMessage };
    delete next[messageId];
    setFeedbackByMessage(next);

    try {
      const response = await fetch("/api/feedback", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chatId, messageId }),
      });

      if (!response.ok) {
        throw new Error("Your feedback could not be cleared.");
      }
    } catch (error) {
      if (previous) {
        setFeedbackByMessage((current) => ({
          ...current,
          [messageId]: previous,
        }));
      }

      throw error;
    }
  }

  function handleSuggestion(suggestion: string) {
    setInput(suggestion);
    requestAnimationFrame(() => {
      document.getElementById("chat-composer")?.focus();
    });
  }

  function handleSetupOpenChange(open: boolean) {
    setSetupOpen(open);

    if (!open) {
      router.replace(`/chat/${chatId}`);
    }
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[96rem] flex-1 gap-8 px-5 pt-5 pb-4 sm:px-8 sm:pt-7 sm:pb-7">
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              Notebook / keyboard
            </p>
            <DialogTitle className="font-display text-2xl tracking-[-0.02em]">
              Keyboard shortcuts
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              Shortcuts pause while you are typing in a field.
            </DialogDescription>
          </DialogHeader>
          <dl className="mt-2 divide-y divide-border font-mono text-[0.68rem]">
            {[
              ["⌘/Ctrl + K", "Open command palette"],
              ["C", "Focus the composer"],
              ["J / K", "Next / previous answer"],
              ["S", "Open the sources sheet (narrow screens)"],
              ["?", "Show this help"],
            ].map(([keys, label]) => (
              <div
                key={keys}
                className="flex items-center justify-between gap-4 py-2"
              >
                <dt className="text-foreground">{keys}</dt>
                <dd className="text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>

      <ShareNotebookDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        chatId={chatId}
        slug={shareSlug}
        onSlugChange={setShareSlug}
      />

      <AddSourceDialog
        open={addSourceOpen}
        onOpenChange={handleAddSourceOpenChange}
        userId={userId}
        chatId={chatId}
        documents={documents}
        isLoading={isLoadingDocuments}
        error={documentsError}
        onUploaded={handleSourceAdded}
        onDelete={deleteDocument}
        onRetry={retryDocument}
        onRefresh={refreshDocument}
        onReindex={reindexDocument}
        onReindexAll={reindexAll}
        indexingStalled={indexingStalled}
        onCheckAgain={checkAgain}
        spreadsheetsEnabled={spreadsheetsEnabled}
      />

      <SourceSetupDialog
        open={setupOpen}
        onOpenChange={handleSetupOpenChange}
        userId={userId}
        chatId={chatId}
        documents={documents}
        isLoading={isLoadingDocuments}
        error={documentsError}
        onUploaded={addDocument}
        onDelete={deleteDocument}
        onRetry={retryDocument}
        onRefresh={refreshDocument}
        onReindex={reindexDocument}
        onReindexAll={reindexAll}
        indexingStalled={indexingStalled}
        onCheckAgain={checkAgain}
        spreadsheetsEnabled={spreadsheetsEnabled}
      />

      <Sheet open={sourcesOpen} onOpenChange={setSourcesOpen}>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Sources</SheetTitle>
          <SheetDescription className="sr-only">
            Upload, paste, or remove the sources in this chat.
          </SheetDescription>
          <div className="min-h-0 flex-1 py-5 pr-12 pl-5">{sourcePanel}</div>
        </SheetContent>
      </Sheet>

      <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
        <SheetContent side="right" className="p-0">
          <SheetTitle className="sr-only">Conversation outline</SheetTitle>
          <SheetDescription className="sr-only">
            Jump to any question in this chat.
          </SheetDescription>
          <div className="flex min-h-0 flex-1 flex-col py-5 pr-12 pl-5">
            <ChatOutline
              turns={turns}
              activeTurnId={activeTurnId}
              onSelect={(turnId) => {
                setOutlineOpen(false);
                scrollToTurn(turnId);
              }}
              className="min-h-0 flex-1"
            />
          </div>
        </SheetContent>
      </Sheet>

      <aside
        aria-label="Sources"
        className="hidden min-h-0 w-64 shrink-0 flex-col border-r border-border pr-6 lg:flex"
      >
        {sourcePanel}
      </aside>

      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div className="border-b border-border pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href="/chat"
                aria-label="All chats"
                className="flex size-8 shrink-0 items-center justify-center rounded-[2px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                <ArrowLeftIcon aria-hidden="true" className="size-4" />
              </Link>
              <div className="min-w-0">
                <p className="font-mono text-[0.62rem] text-muted-foreground">
                  Notebook / {documents.length}{" "}
                  {documents.length === 1 ? "source" : "sources"}
                </p>
                <h1 className="mt-0.5 truncate font-display text-[1.35rem] leading-tight tracking-[-0.01em]">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Export chat as Markdown"
                title="Export chat"
                disabled={messages.length === 0}
                onClick={handleExport}
                className="text-muted-foreground"
              >
                <DownloadIcon aria-hidden="true" className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={shareSlug ? "Shared notebook" : "Share notebook"}
                aria-haspopup="dialog"
                aria-expanded={shareOpen}
                title={shareSlug ? "Shared notebook" : "Share notebook"}
                onClick={() => setShareOpen(true)}
                className="shrink-0 gap-1.5 text-muted-foreground"
              >
                <Share2Icon aria-hidden="true" className="size-3.5" />
                <span className="hidden sm:inline">
                  {shareSlug ? "Shared" : "Share"}
                </span>
              </Button>

              {turns.length >= 2 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Open conversation outline"
                  aria-expanded={outlineOpen}
                  title="Thread"
                  onClick={() => setOutlineOpen(true)}
                  className="shrink-0 gap-1.5 text-muted-foreground xl:hidden"
                >
                  <ListTreeIcon aria-hidden="true" className="size-3.5" />
                  <span className="hidden sm:inline">Thread</span>
                </Button>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-expanded={sourcesOpen}
                onClick={() => setSourcesOpen(true)}
                className="shrink-0 gap-1.5 text-muted-foreground lg:hidden"
              >
                <LibraryBigIcon aria-hidden="true" className="size-3.5" />
                Sources
                <span className="border border-border px-1 font-mono text-[0.62rem] text-foreground">
                  {documents.length}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div
          ref={scrollRef}
          aria-busy={isBusy}
          onScroll={handleConversationScroll}
          className="scrollbar-hidden mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          {hasConversation ? (
            <div className="flex flex-col gap-8 pt-1 pb-5">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  data-turn-id={
                    message.role === "user" ? message.id : undefined
                  }
                  id={
                    message.role === "user"
                      ? turnAnchorId(message.id)
                      : `message-${message.id}`
                  }
                >
                  <ChatMessage
                    chatId={chatId}
                    message={message}
                    isStreaming={
                      status === "streaming" &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                    canRegenerate={
                      !isBusy &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                    onRegenerate={() => void regenerate()}
                    feedback={feedbackByMessage[message.id] ?? null}
                    onSuggestion={handleSuggestion}
                    onRate={(rating, reason, note) =>
                      rateAnswer(message.id, rating, reason, note)
                    }
                    onClearFeedback={() => clearAnswerFeedback(message.id)}
                  />
                </div>
              ))}

              {status === "submitted" ? <ThinkingIndicator /> : null}

              {error ? (
                <ErrorNotice
                  message={error.message || "The answer didn't come through."}
                  onRetry={() => regenerate()}
                />
              ) : null}
            </div>
          ) : (
            <EmptyState
              documents={documents}
              starterQuestions={starterQuestions}
              onAddSource={() => {
                setAddSourceOpen(true);
              }}
              onSuggestion={handleSuggestion}
            />
          )}
        </div>

        <ChatComposer
          value={input}
          onValueChange={setInput}
          onSend={(text) => {
            if (messages.length === 0) {
              setTitle(chatTitleFromQuery(text));
            }

            shouldFollowRef.current = true;
            setAnnouncement("");
            clearError();
            setInput("");
            void sendMessage({ text });
          }}
          onStop={stop}
          isBusy={isBusy}
        />
      </div>

      <aside
        aria-label="Conversation outline"
        className="hidden min-h-0 w-56 shrink-0 flex-col border-l border-border pl-6 xl:flex"
      >
        {turns.length >= 2 ? (
          <ChatOutline
            turns={turns}
            activeTurnId={activeTurnId}
            onSelect={scrollToTurn}
            className="min-h-0 flex-1"
          />
        ) : null}
      </aside>
    </div>
  );
}
