import { NextRequest, NextResponse } from "next/server";
import { analyzeGap } from "@/lib/analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { curriculumText, jobPostings } = body;

    if (!curriculumText?.trim()) {
      return NextResponse.json({ error: "Curriculum text is required" }, { status: 400 });
    }

    if (!jobPostings?.length) {
      return NextResponse.json({ error: "At least one job posting is required" }, { status: 400 });
    }

    const result = await analyzeGap({ curriculumText, jobPostings });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
