import mammoth from "mammoth";
import { parse as csvParse } from "csv-parse/sync";

export async function parseFile(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();

  switch (ext) {
    case "pdf":
      return parsePDF(buffer);
    case "docx":
      return parseDOCX(buffer);
    case "csv":
      return parseCSV(buffer);
    case "txt":
      return buffer.toString("utf-8");
    default:
      throw new Error(`Unsupported file type: .${ext}. Supported: PDF, DOCX, CSV, TXT`);
  }
}

async function parsePDF(buffer: Buffer): Promise<string> {
  // Import from lib/ directly to avoid the test-file loader in the main entry
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
    dataBuffer: Buffer,
    options?: object,
  ) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parseCSV(buffer: Buffer): string {
  const content = buffer.toString("utf-8");
  const records = csvParse(content, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  // Flatten all cells into a readable text block
  return (records as string[][])
    .map((row: string[]) => row.join(", "))
    .join("\n");
}
