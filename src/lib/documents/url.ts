const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

export function pageDocumentTitle(url: string, title: string | null): string {
  try {
    return title?.trim() || new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return title?.trim() || "Web page";
  }
}

export function pageDocumentFilename(title: string): string {
  return `${title.replace(INVALID_FILENAME_CHARS, "-").slice(0, 120)}.txt`;
}
