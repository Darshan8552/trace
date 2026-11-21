export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_CHAT = 10;
export const MAX_PASTED_TEXT_CHARS = 200_000;

export const UPLOAD_TYPES = [
  { mimeType: "application/pdf", extensions: [".pdf"] },
  {
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: [".docx"],
  },
  { mimeType: "text/plain", extensions: [".txt"] },
  { mimeType: "text/markdown", extensions: [".md", ".markdown"] },
  { mimeType: "text/csv", extensions: [".csv"] },
  {
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: [".xlsx"],
  },
] as const;

export const ACCEPTED_MIME_TYPES: string[] = UPLOAD_TYPES.map(
  (type) => type.mimeType,
);

const SPREADSHEET_MIME_TYPES = new Set([
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function isSpreadsheetMime(mimeType: string): boolean {
  return SPREADSHEET_MIME_TYPES.has(mimeType);
}

const ALL_EXTENSIONS = UPLOAD_TYPES.flatMap((type) => type.extensions);

export function uploadPolicy(spreadsheetsEnabled: boolean) {
  const types = spreadsheetsEnabled
    ? [...UPLOAD_TYPES]
    : UPLOAD_TYPES.filter((type) => !isSpreadsheetMime(type.mimeType));
  const extensions = types.flatMap((type) => type.extensions);
  const label = types
    .map((type) => type.extensions[0].replace(".", "").toUpperCase())
    .join(" / ");

  return {
    accept: extensions.join(","),
    extensions,
    mimeTypes: types.map((type) => type.mimeType),
    label,
  };
}

export function rejectionForFilename(
  filename: string,
  spreadsheetsEnabled: boolean,
): string | null {
  const lower = filename.toLowerCase();
  const { extensions, label } = uploadPolicy(spreadsheetsEnabled);

  if (extensions.some((extension) => lower.endsWith(extension))) {
    return null;
  }

  if (
    !spreadsheetsEnabled &&
    ALL_EXTENSIONS.some((extension) => lower.endsWith(extension))
  ) {
    return "Spreadsheets are not enabled yet.";
  }

  return `Only ${label} files are supported.`;
}

export function mimeTypeForFilename(filename: string): string | null {
  const lower = filename.toLowerCase();

  for (const type of UPLOAD_TYPES) {
    if (type.extensions.some((extension) => lower.endsWith(extension))) {
      return type.mimeType;
    }
  }

  return null;
}

export function titleForFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^.]+$/, "").trim();

  return (withoutExtension || filename).slice(0, 160);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const countFormatter = new Intl.NumberFormat("en-US");

export function formatCount(value: number): string {
  return countFormatter.format(value);
}
