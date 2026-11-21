import "server-only";
import Tesseract from "tesseract.js";
import { renderPageAsImage } from "unpdf";
import type { ExtractedPage } from "./extract";

const MAX_OCR_PAGES = 10;
const OCR_SCALE = 1.5;

export async function ocrPdf(
  bytes: Uint8Array,
  totalPages: number | null,
): Promise<ExtractedPage[]> {
  const worker = await Tesseract.createWorker("eng");
  const limit = Math.min(totalPages ?? MAX_OCR_PAGES, MAX_OCR_PAGES);
  const pages: ExtractedPage[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
      const image = await renderPageAsImage(bytes, pageNumber, {
        scale: OCR_SCALE,
      });
      const { data } = await worker.recognize(Buffer.from(image));
      const text = data.text?.trim();

      if (text) {
        pages.push({ page: pageNumber, text });
      }
    }
  } finally {
    await worker.terminate();
  }

  return pages;
}
