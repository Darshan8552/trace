import type { UIMessage } from "ai";

export type ChatSource = {
  number: number;
  documentId: string;
  title: string;
  page: number | null;
  similarity: number;
  chunkId?: string;
  snippet?: string;
};

export type ChatUIMessage = UIMessage<never, { sources: ChatSource[] }>;

export function sourceFileHref(source: ChatSource): string {
  const base = `/api/documents/${source.documentId}/file`;

  return source.page ? `${base}#page=${source.page}` : base;
}

export function sourceHref(source: ChatSource, chatId?: string): string {
  if (!chatId || !source.chunkId) {
    return sourceFileHref(source);
  }

  const query = new URLSearchParams({ chunk: source.chunkId });

  return `/chat/${chatId}/source/${source.documentId}?${query.toString()}`;
}
