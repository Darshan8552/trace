export const DOCUMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type DocumentSummary = {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sourceUrl: string | null;
  sourceCheckedAt: string | null;
  contentHash: string | null;
  pageCount: number | null;
  status: DocumentStatus;
  error: string | null;
  searchable: boolean;
  createdAt: string;
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: "Queued",
  PROCESSING: "Indexing",
  READY: "Indexed",
  FAILED: "Failed",
};

export function isIndexingStatus(status: DocumentStatus): boolean {
  return status === "PENDING" || status === "PROCESSING";
}

export function isStaleDocument(
  document: Pick<DocumentSummary, "status" | "searchable">,
): boolean {
  return document.status === "READY" && !document.searchable;
}
