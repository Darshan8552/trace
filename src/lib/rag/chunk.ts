import type { ExtractedPage } from "./extract";

export type TextChunk = {
  content: string;
  page: number | null;
  position: number;
};

const TARGET_CHARS = 3600;
const OVERLAP_CHARS = 600;
const MIN_CHUNK_CHARS = 40;

function lastBreak(text: string, from: number, to: number): number {
  for (let index = to; index > from; index -= 1) {
    const character = text[index - 1];

    if (character === "\n" || character === " " || character === ".") {
      return index;
    }
  }

  return to;
}

function firstBreak(text: string, from: number, to: number): number {
  for (let index = from; index < to; index += 1) {
    const character = text[index];

    if (character === "\n" || character === " " || character === ".") {
      return index + 1;
    }
  }

  return from;
}

function splitPage(text: string): string[] {
  if (text.length <= TARGET_CHARS) {
    return [text];
  }

  const pieces: string[] = [];
  let start = 0;

  while (start < text.length) {
    const limit = Math.min(start + TARGET_CHARS, text.length);
    const end = limit === text.length ? limit : lastBreak(text, start, limit);
    const piece = text.slice(start, end).trim();

    if (piece.length > 0) {
      pieces.push(piece);
    }

    if (end >= text.length) {
      break;
    }

    const overlapStart = Math.max(start + 1, end - OVERLAP_CHARS);
    start = firstBreak(text, overlapStart, end);
  }

  return pieces;
}

export function chunkPages(pages: ExtractedPage[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  let position = 0;

  for (const page of pages) {
    for (const content of splitPage(page.text)) {
      if (content.length < MIN_CHUNK_CHARS && chunks.length > 0) {
        continue;
      }

      chunks.push({ content, page: page.page, position });
      position += 1;
    }
  }

  return chunks;
}
