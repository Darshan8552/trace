import "server-only";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import type { Extraction } from "./extract";

const MAX_ROWS = 200;
const MAX_COLUMNS = 30;
const MAX_CELL_CHARS = 200;
const MAX_TEXT_CHARS = 20_000;

function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }

    if ("result" in value) {
      return cellText((value as { result: unknown }).result);
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function toExtraction(
  sheets: { name: string; rows: string[][] }[],
): Extraction {
  const sections: string[] = [];

  for (const sheet of sheets) {
    const rows = sheet.rows.slice(0, MAX_ROWS);

    if (rows.length === 0) {
      continue;
    }

    const width = Math.min(
      MAX_COLUMNS,
      Math.max(...rows.map((row) => row.length)),
    );
    const padded = rows.map((row) =>
      Array.from({ length: width }, (_, index) =>
        escapeCell((row[index] ?? "").slice(0, MAX_CELL_CHARS)),
      ),
    );
    const [header, ...body] = padded;
    const lines = [
      `SHEET ${sheet.name}`,
      `Columns: ${header.join(", ")}`,
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...body.map((row) => `| ${row.join(" | ")} |`),
    ];

    sections.push(lines.join("\n"));
  }

  const text = sections.join("\n\n").slice(0, MAX_TEXT_CHARS).trim();

  return {
    pages: text ? [{ page: null, text }] : [],
    totalPages: null,
  };
}

export function csvToExtraction(bytes: Uint8Array): Extraction {
  const text = new TextDecoder().decode(bytes);
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
  });
  const rows = parsed.data.filter((row) => Array.isArray(row));
  const name = parsed.meta.delimiter ? "CSV data" : "Spreadsheet";

  return toExtraction([{ name, rows }]);
}

export async function xlsxToExtraction(bytes: Uint8Array): Promise<Extraction> {
  const workbook = new ExcelJS.Workbook();

  type LoadBuffer = Parameters<typeof workbook.xlsx.load>[0];

  await workbook.xlsx.load(Buffer.from(bytes) as unknown as LoadBuffer);

  const sheets = workbook.worksheets.map((worksheet) => {
    const rows: string[][] = [];
    const rowLimit = Math.min(worksheet.rowCount, MAX_ROWS);
    const columnLimit = Math.min(worksheet.columnCount, MAX_COLUMNS);

    for (let rowNumber = 1; rowNumber <= rowLimit; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const values: string[] = [];

      for (let column = 1; column <= columnLimit; column += 1) {
        values.push(cellText(row.getCell(column).value));
      }

      rows.push(values);
    }

    return { name: worksheet.name || "Sheet", rows };
  });

  return toExtraction(sheets);
}
