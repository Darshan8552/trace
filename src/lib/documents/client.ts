import { upload } from "@vercel/blob/client";
import { bytesToHex } from "./hash";
import type { DocumentSummary } from "./types";
import {
  formatCount,
  MAX_PASTED_TEXT_CHARS,
  MAX_UPLOAD_BYTES,
  mimeTypeForFilename,
  titleForFilename,
} from "./upload";

const SUPPORTED_EXTENSION = /\.(pdf|docx|txt|md|markdown|csv|xlsx)$/i;
const UPLOAD_TIMEOUT_MS = 120_000;
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

function extensionForFilename(filename: string): string {
  return filename.match(SUPPORTED_EXTENSION)?.[0].toLowerCase() ?? "";
}

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            "The upload took too long. Check your connection and try again.",
          ),
        ),
      UPLOAD_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function contentHashForFile(file: File): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );

  return bytesToHex(new Uint8Array(digest));
}

export async function uploadDocument({
  file,
  userId,
  chatId,
  title,
}: {
  file: File;
  userId: string;
  chatId: string;
  title?: string;
}): Promise<DocumentSummary> {
  const mimeType = mimeTypeForFilename(file.name) ?? file.type;

  if (!mimeType) {
    throw new Error("That file type is not supported.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Files must be 20 MB or smaller.");
  }

  const contentHash = await contentHashForFile(file);
  const pathname = `documents/${userId}/${crypto.randomUUID()}${extensionForFilename(file.name)}`;
  const blob = await withTimeout(
    upload(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/documents/upload",
      contentType: mimeType,
    }),
  );

  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chatId,
      pathname: blob.pathname,
      filename: file.name,
      title: title ?? titleForFilename(file.name),
      contentHash,
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    document?: DocumentSummary;
    error?: string;
  } | null;

  if (!response.ok || !payload?.document) {
    throw new Error(payload?.error ?? "The document could not be saved.");
  }

  return payload.document;
}

export async function uploadTextDocument({
  userId,
  chatId,
  title,
  text,
}: {
  userId: string;
  chatId: string;
  title: string;
  text: string;
}): Promise<DocumentSummary> {
  const content = text.trim();

  if (!content) {
    throw new Error("Paste some text before adding it.");
  }

  if (content.length > MAX_PASTED_TEXT_CHARS) {
    throw new Error(
      `Pasted text must be ${formatCount(MAX_PASTED_TEXT_CHARS)} characters or fewer.`,
    );
  }

  const safeTitle =
    title.trim().slice(0, 160) ||
    content.split("\n")[0]?.trim().slice(0, 60) ||
    "Pasted text";
  const filename = `${safeTitle.replace(INVALID_FILENAME_CHARS, "-")}.txt`;
  const file = new File([content], filename, { type: "text/plain" });

  return uploadDocument({ file, userId, chatId, title: safeTitle });
}
