import type { DocumentSummary } from "./types";

const NO_TEXT = "No readable text was found in this file.";
const URL_FAILURE = "That page could not be loaded";

export function friendlyDocumentError(
  document: DocumentSummary,
): string | null {
  const raw = document.error?.trim();

  if (!raw) {
    return null;
  }

  if (raw.includes(NO_TEXT)) {
    return document.mimeType === "application/pdf"
      ? "No selectable text was found. If this is a scan, paste the text or add an OCR-enabled copy."
      : "No readable text was found in this file. Try a different format.";
  }

  if (raw.includes(URL_FAILURE) || document.sourceUrl) {
    return "This page could not be read. Refresh it, or remove it and add the address again.";
  }

  return "This source could not be indexed. Try again, or remove and re-add it.";
}
