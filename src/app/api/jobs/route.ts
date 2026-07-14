import { NextRequest, NextResponse } from "next/server";
import { searchJobs } from "@/lib/jobs";
import { hasRapidApiKey, searchDemoJobs } from "@/lib/demo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location } = body;

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    // Live job data when a RapidAPI key is configured; otherwise fall back to the
    // bundled demo corpus so the app is fully usable with zero keys.
    if (hasRapidApiKey()) {
      const jobs = await searchJobs({ query, location: location || "", numPages: 1 });
      return NextResponse.json({ jobs, count: jobs.length, source: "jsearch" });
    }

    const jobs = searchDemoJobs(query, location || "");
    return NextResponse.json({ jobs, count: jobs.length, source: "demo" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
