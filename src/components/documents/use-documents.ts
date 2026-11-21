"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type DocumentSummary,
  isIndexingStatus,
  isStaleDocument,
} from "@/lib/documents/types";

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 120;

export function useDocuments(chatId: string) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexingStalled, setIndexingStalled] = useState(false);
  const polls = useRef(0);
  const inFlight = useRef(new Set<string>());

  const processDocuments = useCallback(async (items: DocumentSummary[]) => {
    for (const document of items) {
      if (
        !isIndexingStatus(document.status) ||
        inFlight.current.has(document.id)
      ) {
        continue;
      }

      inFlight.current.add(document.id);

      try {
        await fetch(`/api/documents/${document.id}/process`, {
          method: "POST",
        });
      } catch {
      } finally {
        inFlight.current.delete(document.id);
      }
    }
  }, []);

  const load = useCallback(async (): Promise<DocumentSummary[] | null> => {
    try {
      const response = await fetch(
        `/api/documents?chatId=${encodeURIComponent(chatId)}`,
      );

      if (!response.ok) {
        throw new Error("Your sources could not be loaded.");
      }

      const payload = (await response.json()) as {
        documents: DocumentSummary[];
      };

      setDocuments(payload.documents);
      setError(null);

      return payload.documents;
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your sources could not be loaded.",
      );

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    void (async () => {
      const items = await load();

      if (items) {
        await processDocuments(items);
      }
    })();
  }, [load, processDocuments]);

  const isPolling = documents.some((document) =>
    isIndexingStatus(document.status),
  );

  useEffect(() => {
    if (!isPolling || indexingStalled) {
      if (!isPolling) {
        polls.current = 0;
        setIndexingStalled(false);
      }

      return;
    }

    const timer = setInterval(() => {
      if (polls.current >= MAX_POLLS) {
        clearInterval(timer);
        setIndexingStalled(true);
        return;
      }

      polls.current += 1;

      void (async () => {
        const items = await load();

        if (items) {
          await processDocuments(items);
        }
      })();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPolling, indexingStalled, load, processDocuments]);

  const checkAgain = useCallback(async () => {
    polls.current = 0;
    setIndexingStalled(false);

    const items = await load();

    if (items) {
      await processDocuments(items);
    }
  }, [load, processDocuments]);

  const addDocument = useCallback(
    (document: DocumentSummary) => {
      polls.current = 0;
      setIndexingStalled(false);
      setDocuments((current) => [
        document,
        ...current.filter((item) => item.id !== document.id),
      ]);
      void processDocuments([document]);
    },
    [processDocuments],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const index = documents.findIndex((item) => item.id === id);
      const removed = documents[index];

      setDocuments((current) => current.filter((item) => item.id !== id));

      try {
        const response = await fetch(`/api/documents/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("That source could not be removed.");
        }
      } catch (deleteError) {
        if (removed) {
          setDocuments((current) => {
            if (current.some((item) => item.id === removed.id)) {
              return current;
            }

            const next = [...current];
            next.splice(Math.min(index, next.length), 0, removed);
            return next;
          });
        }

        throw deleteError;
      }
    },
    [documents],
  );

  const retryDocument = useCallback(
    async (id: string) => {
      polls.current = 0;
      setIndexingStalled(false);

      const response = await fetch(`/api/documents/${id}/process`, {
        method: "POST",
      });
      await load();

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(payload?.error ?? "This source could not be indexed.");
      }
    },
    [load],
  );

  const refreshDocument = useCallback(
    async (id: string) => {
      polls.current = 0;
      setIndexingStalled(false);
      setDocuments((current) =>
        current.map((document) =>
          document.id === id
            ? { ...document, status: "PROCESSING", error: null }
            : document,
        ),
      );

      try {
        const response = await fetch(`/api/documents/${id}/refresh`, {
          method: "POST",
        });
        const payload = (await response.json().catch(() => null)) as {
          changed?: boolean;
          error?: string;
        } | null;

        await load();

        if (!response.ok) {
          throw new Error(
            payload?.error ?? "That page could not be refreshed.",
          );
        }

        return payload?.changed ?? false;
      } catch (refreshError) {
        await load();
        throw refreshError;
      }
    },
    [load],
  );

  const reindexDocument = useCallback(
    async (id: string) => {
      polls.current = 0;
      setIndexingStalled(false);
      setDocuments((current) =>
        current.map((document) =>
          document.id === id
            ? { ...document, status: "PROCESSING", error: null }
            : document,
        ),
      );
      inFlight.current.add(id);

      try {
        const response = await fetch(`/api/documents/${id}/process`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reindex: true }),
        });
        await load();

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;

          throw new Error(
            payload?.error ?? "This source could not be reindexed.",
          );
        }
      } catch (reindexError) {
        await load();
        throw reindexError;
      } finally {
        inFlight.current.delete(id);
      }
    },
    [load],
  );

  const reindexAll = useCallback(async () => {
    const staleIds = documents
      .filter(isStaleDocument)
      .map((document) => document.id);

    if (staleIds.length === 0) {
      return;
    }

    polls.current = 0;
    setIndexingStalled(false);
    setDocuments((current) =>
      current.map((document) =>
        staleIds.includes(document.id)
          ? { ...document, status: "PROCESSING", error: null }
          : document,
      ),
    );

    for (const id of staleIds) {
      inFlight.current.add(id);
    }

    try {
      const responses = await Promise.all(
        staleIds.map((id) =>
          fetch(`/api/documents/${id}/process`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ reindex: true }),
          }),
        ),
      );
      await load();

      const failed = responses.find((response) => !response.ok);

      if (failed) {
        const payload = (await failed.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(
          payload?.error ?? "Some sources could not be reindexed.",
        );
      }
    } finally {
      for (const id of staleIds) {
        inFlight.current.delete(id);
      }
    }
  }, [documents, load]);

  return {
    documents,
    isLoading,
    error,
    indexingStalled,
    addDocument,
    deleteDocument,
    retryDocument,
    refreshDocument,
    reindexDocument,
    reindexAll,
    checkAgain,
  };
}
