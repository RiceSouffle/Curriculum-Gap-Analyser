import { NextRequest, NextResponse } from "next/server";
import { searchJobs } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location } = body;

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const jobs = await searchJobs({
      query,
      location: location || "",
      numPages: 1,
    });

    return NextResponse.json({ jobs, count: jobs.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
