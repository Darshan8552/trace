export type SearchNotebook = {
  id: string;
  title: string;
  updatedAt: string;
};

export type SearchAnswer = {
  chatId: string;
  chatTitle: string;
  messageId: string;
  snippet: string;
};

export type SearchSource = {
  chatId: string;
  chatTitle: string;
  documentId: string;
  documentTitle: string;
  chunkId: string;
  page: number | null;
  snippet: string;
};

export type SearchResults = {
  notebooks: SearchNotebook[];
  answers: SearchAnswer[];
  sources: SearchSource[];
};

export const EMPTY_SEARCH_RESULTS: SearchResults = {
  notebooks: [],
  answers: [],
  sources: [],
};

export function normalizeSearchQuery(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}
