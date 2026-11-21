import "server-only";
import mammoth from "mammoth";
import { extractText } from "unpdf";
import { serverEnv } from "@/lib/env";
import { ocrPdf } from "./ocr";
import { csvToExtraction, xlsxToExtraction } from "./spreadsheets";

export type ExtractedPage = {
  page: number | null;
  text: string;
};

export type Extraction = {
  pages: ExtractedPage[];
  totalPages: number | null;
};

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
]);

const CSV_MIME_TYPE = "text/csv";
const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeExtraction(extraction: Extraction): Extraction {
  return {
    totalPages: extraction.totalPages,
    pages: extraction.pages.map((page) => ({
      page: page.page,
      text: normalizeText(page.text),
    })),
  };
}

export async function extractPages({
  bytes,
  mimeType,
}: {
  bytes: Uint8Array;
  mimeType: string;
}): Promise<Extraction> {
  if (mimeType === "application/pdf") {
    const { text: pages, totalPages } = await extractText(bytes, {
      mergePages: false,
    });

    const readable = pages
      .map((text, index) => ({
        page: index + 1,
        text: normalizeText(text),
      }))
      .filter((page) => page.text.length > 0);

    if (readable.length === 0 && serverEnv().INGEST_OCR) {
      const ocrPages = await ocrPdf(bytes, totalPages);

      return {
        totalPages,
        pages: ocrPages.map((page) => ({
          page: page.page,
          text: normalizeText(page.text),
        })),
      };
    }

    return { totalPages, pages: readable };
  }

  if (mimeType === DOCX_MIME_TYPE) {
    const { value } = await mammoth.extractRawText({
      buffer: Buffer.from(bytes),
    });
    const text = normalizeText(value);

    return {
      totalPages: null,
      pages: text ? [{ page: null, text }] : [],
    };
  }

  if (mimeType === CSV_MIME_TYPE) {
    if (!serverEnv().INGEST_SPREADSHEETS) {
      throw new Error("Spreadsheet sources are not enabled.");
    }

    return normalizeExtraction(csvToExtraction(bytes));
  }

  if (mimeType === XLSX_MIME_TYPE) {
    if (!serverEnv().INGEST_SPREADSHEETS) {
      throw new Error("Spreadsheet sources are not enabled.");
    }

    return normalizeExtraction(await xlsxToExtraction(bytes));
  }

  if (TEXT_MIME_TYPES.has(mimeType)) {
    const text = normalizeText(new TextDecoder().decode(bytes));

    return {
      totalPages: null,
      pages: text ? [{ page: null, text }] : [],
    };
  }

  throw new Error("That file type cannot be read.");
}
