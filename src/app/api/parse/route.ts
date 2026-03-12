import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parseFile(buffer, file.name);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from file. The file may be empty or image-based." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text, filename: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
